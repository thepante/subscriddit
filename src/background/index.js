import zango from 'zangodb';
import { format } from 'timeago.js';
import $ from 'jquery';

// Initialize db
let db = new zango.Db('rts', { subscription: ['_id,comments,sub,title,url,time,check'] });
let subs = db.collection('subscription');
var post = {};

// Default settings | h/m/l = priority, i = interval
var prefs = { h: 2, hi: 30, m: 24, mi: 60, l: 48, li: 480 };

// Load user preferences
async function load_prefs() {
  await chrome.storage.local.get(null, (item) => {
    console.log(item);
    for (let key in item) {
      if (key != undefined) {
        prefs[key] = item[key];
        // console.log(key, prefs[key]);
      }
    }
  });
}

// Notifications 
function notify(title, message, author, permalink){

  chrome.notifications.create(permalink, {  
    title: `${title}`,  
    message: `${author} ${message}`,
    iconUrl: '16.png',
    type: 'basic'
    // requireInteraction: true
  });

}

// Listen for notification click
chrome.notifications.onClicked.addListener(function(permalink){
  // RSS method:
  chrome.tabs.create({ url: permalink });
});

// Check if a given thread is in db
async function check_subscribed(thread){
  let state = null;
  await subs.find({ _id: thread }).forEach(t => state = true);
  if (state != true) {state = false};
  return state;
}

// Get number of new comments for a given thread
async function comments_diff(thread, comments){

  let threadURL = `https://www.reddit.com/api/info.json?id=t3_${thread}`;
  const results = await (await fetch(threadURL)).json();

  let num_comments = results.data.children[0].data.num_comments;
  return num_comments - comments;
}

// Check new comments diff of given thread, if any: parse
async function check_new_comments(thread, comments){

  let diff = await comments_diff(thread, comments);
  let subscribed = await check_subscribed(thread);
  
  if (subscribed && diff > 10) {
    console.log(`${thread} 🡺 Has +10 (${diff}) new comments 🡺 General notification instead!`);
    await general_notification(thread, comments, diff);
  }
  else if (subscribed && diff > 0) {
    console.log(`${thread} 🡺 Has ${diff} new comments`);
    await get_comments_rss(thread, comments, diff);
    console.log(thread, comments, diff)
  }

}

async function get_comments_rss(thread, db_comments, diff){

  // let sub = null;
  let title = null;
  let check = null;

  await subs.find({ _id: thread }).forEach( async t => {
    // sub = t.title;
    title = t.title;
    check = t.check;
  });

  let rss = `https://www.reddit.com/${thread}.rss?t=week&sort=new&limit=2000`
  let log_msg = `${thread} 🡺`;

  $.get(rss, async function (data) {
    $(data).find("entry").each( async function () {

      let el = $(this);
      let updated = el.find("updated").text();
      updated = Date.parse(updated);

      let regex = /( |<([^>]+)>)/ig; 
      let regex2 = /(&#39;)/g;
      let comment = el.find("content").text();
      comment = `"${comment.replace(regex, " ").trim()}"`;
      comment = comment.replace(regex2, "'");

      if (comment == '[removed]' || comment == '[deleted]') {
        console.log(`${log_msg} Skipped deleted comment`);
      } 
      else if (updated < check) {
        console.log(`${log_msg} Skipped old comment`);
      }
      else {

        let author = el.find("author").find("name").text().substr(1)+":";
        let permalink = el.find("link").attr('href')+"?context=1";

        console.log("------------------------");
        console.log("comment: " + comment);
        console.log(" author: " + author);
        console.log("   link: " + permalink);

        // Update check timestamp
        await subs.update({ _id: thread }, {
          comments: (db_comments + diff),
          check: Date.now()
        },
          (error) => {if (error) { throw error; }
        });

        notify(title, comment, author, permalink);
        await new Promise(r => setTimeout(r, 1000));

      }
    })
  });

}

async function general_notification(thread, db_comments, diff){
  let title = null;
  await subs.find({_id: thread}).forEach(async t => {title = t.title})

  let n = {
    title: `${title}`,
    message: `are ${diff} new comments found!`,
    author: `There`,
    permalink: `https://www.reddit.com/${thread}?sort=new`
  };
  
  notify(n.title, n.message, n.author, n.permalink);

  await subs.update({ _id: thread }, {comments: (db_comments + diff)},
    (error) => {if (error) { throw error; }
  });

  await new Promise(r => setTimeout(r, 1000));
}


// Constant scanner
async function scanner(cap){

  let limit = Date.now() - cap * 1000 * 60 * 60;

  await subs.find({time: {$gt: limit }})
    .forEach( async thread => {  
      await check_new_comments(thread._id, thread.comments);
    })
    // .then(console.log(`threads in database scanned`))
    .catch(error => console.error(error));


}

// Call scanner frequenly.
// hs = cap since subscription, interval = seconds between searchs
async function constant_search(select){

  while (true){
    var hs = prefs[select];
    var interval = prefs[select+'i'] * 1000;

    // Delay start for lower priorities to avoid check same threads in same time
    if (hs > prefs.h) {await new Promise(r => setTimeout(r, 3000));}
    if (hs > prefs.m) {await new Promise(r => setTimeout(r, 3000));}
  
    // interval *= 1000;

    var d = new Date();
    var w = d.toLocaleTimeString();

    console.log(`Constant search: cap ${hs}, interval ${prefs[select+'i']}, time ${w}`);
    await scanner(hs);

    await new Promise(r => setTimeout(r, interval));
  }
}


// Parse thread data
async function parse_data(url, dict) {
  let threadURL = url+'.json';
  const results = await (await fetch(threadURL)).json();

  let dato = results[0].data.children[0].data;
  let parsed = {
         _id: dato.id,
    comments: dato.num_comments,
         sub: dato.subreddit_name_prefixed,
       title: dato.title,
         url: dato.permalink,
       check: Date.now()
  }

  Object.assign(dict, parsed);

  console.log(`${dato.id} 🡺 Thread data parsed...`);

  // Parsed, now check status
  checker(post._id);

}

// Check if its a subscribed thread
async function checker(thread) {
  let msg = `${thread} 🡺 Check · Subscription status:`
  let subscribed = await check_subscribed(thread);
  
  subs.find({ _id: thread })
    .forEach(t => {
      post["time"] = t.time;
      post["comments"] = t.comments;

    })
    .then(e => {

      console.log(msg, subscribed);

      // Send sign to put button, set status and parsed data
      // Subscribed is sent as string, workaround bc idk why but can't send that as boolean
      content.postMessage({
        check: subscribed.toString(),
        post: post,
        button:"_"
      });

    })
    .catch(error => {
      console.log("ERROR:", error);
    });

    console.log(`${thread} 🡺 Data sent to content script`);

}

// Communicate with content js
var content;
function connected(p) {
  content = p;
  content.onMessage.addListener(function(m) {

    // de test
    if (m.greeting) {
      console.log(m.greeting);
    }

    if (m.load_prefs) {
      load_prefs();
    }

    // Add new subscription
    if (m.add) {
      subs.insert(m.add, (error) => {
        if (error) { throw error; }
      });
      console.log(`${m.add._id} 🡺 Added new subscription (${m.add.comments} comments)`);
    }

    // Remove a subscription
    if (m.remove) {
      subs.remove({_id: m.remove._id}, (error) => {
        if (error) { throw error; }
      });
      post.time = undefined;
      post.check = undefined;

      console.log(`${m.remove._id} 🡺 Removed · Subscribed ${format(m.remove.time)}`);
    }

    // When a thread is open scan it
    if (m.scan) {
      // second argument is the dictionary where to save the parsed data
      parse_data(m.scan, post);
    }
    
  });
}

// content.postMessage({scan:"_"});

chrome.runtime.onConnect.addListener(connected);

// Init with a list of all subcriptions
async function list_all(){
	await subs.find().forEach(t => {
    console.log(`DB: ${t.sub}/${t._id} | ${t.comments} | ${format(t.time)} | 
    https://www.reddit.com/${t.sub}/comments/${t._id}`);
  });
  
  console.log("---------------------------------");

}

async function start(){
  await list_all();

  // Start constant searches
  // High, Medium, and Low prio
  constant_search('h');
  constant_search('m');
  constant_search('l');
}

load_prefs();
start();


var d = new Date();
var w = d.toLocaleTimeString();
console.log("Background js file loaded", w);
