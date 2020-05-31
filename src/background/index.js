import zango from 'zangodb';
import { format } from 'timeago.js';
import $ from 'jquery';

// Initialize db
let db = new zango.Db('rts', { subscription: ['_id'] });
let subs = db.collection('subscription');

// Default settings
var prefs = {
    prioHigh: {age:  2, poll: 30},
  prioMedium: {age: 24, poll: 60},
     prioLow: {age: 48, poll: 480},
    forgetHs: 72,
};

// Load user preferences
async function load_prefs() {
  await chrome.storage.local.get(null, async (options) => {
    // console.log(options);
    if (options.prioHigh == null){
      await chrome.storage.local.set(prefs);
      console.log("Applied defaults settings");
    } else {
      await Object.assign(prefs, options);
      console.log("Loaded saved settings");
    }
  });
}

// Notifications
var notification = {
  send(title, message, author, permalink){
    chrome.notifications.create(permalink, {  
      title: `${title}`,  
      message: `${author} ${message}`,
      iconUrl: '16.png',
      type: 'basic'
      // requireInteraction: true
    });
  },

  async generic(thread, saved_comments, new_comments){
    let title = null;
    await subs.find({_id: thread}).forEach(async t => {title = t.title})
  
    this.send(title, `are ${new_comments} new comments found!`, `There`, `https://www.reddit.com/${thread}?sort=new`);
    console.log(title, `are ${new_comments} new comments found!`, `There`, `https://www.reddit.com/${thread}?sort=new`);

    // update comments count
    await subs.update({ _id: thread }, {
        comments: (saved_comments + new_comments)
      }, (error) => {if (error) { throw error; }
    });

    await new Promise(r => setTimeout(r, 1000));
  }
}

// Listen for notification click
chrome.notifications.onClicked.addListener(function(permalink){
  // RSS method:
  chrome.tabs.create({ url: permalink });
});

// POST OBJECT - VERSION3
var post = {
  data: {},

  async parse_json(url) {
    const results = await (await fetch(url+'.json')).json();
    let dato = results[0].data.children[0].data;

    this.data._id = dato.id;
    this.data.comments = dato.num_comments;
    this.data.sub = dato.subreddit_name_prefixed;
    this.data.title = dato.title;
    this.data.url = dato.permalink;
    this.data.check = Date.now();
    this.data.subscribed = undefined;

    console.log(`${this.data._id} 🡺 Thread data parsed...`);
    
    this.notify_state();

  },

  async notify_state(){
    let state = null;
    await subs.find({ _id: this.data._id }).forEach(t => {
      state = true;
      this.data.subscribed = t.subscribed;
    });

    if (state != true) {state = false};

    console.log(`${this.data._id} 🡺 Check · Subscription status:`, state);
    
    // send to content js
    content.postMessage({
      post: this.data,
    });

    this.log();
  },

  log(){
    console.log(Object.entries(this.data));
  }
};

// MANAGE SUBSCRIPTIONS
var subscriptions = {
  add(thread){
    subs.insert(thread, (error) => {
      if (error) { throw error; }
    });
    console.log(`${thread._id} 🡺 Added new subscription with ${thread.comments} comments`);
  },

  remove(thread, auto){
    let specific;

    subs.remove({_id: thread._id}, (error) => {
      if (error) { throw error; }
    });

    post.data.subscribed = undefined;
    post.data.check = undefined;

    if (auto){specific = "by clean_olds ";} else {specific = "";}

    console.log(`${thread._id} 🡺 Removed ${specific}· Subscribed ${format(thread.subscribed)}`);
  },

  async clean_olds(){
    console.log("clean_olds opened", prefs.forgetHs);

    let limit = Date.now() - prefs.forgetHs * 1000 * 60 * 60;

    await subs.find({subscribed: {$lt: limit }})
      .forEach( async thread => {
        this.remove(thread, true);
      })
      // .then(console.log(`threads in database scanned`))
      .catch(error => console.error(error, cap));
  }

}

var check_post = {
  // Get number of new comments for a given thread
  async comments_diff(thread, comments){

    let threadURL = `https://www.reddit.com/api/info.json?id=t3_${thread}`;
    const results = await (await fetch(threadURL)).json();

    let num_comments = results.data.children[0].data.num_comments;
    return num_comments - comments;
  },
  // Check new comments diff of given thread, if any: parse
  async new_comments(thread, comments){
    let diff = await this.comments_diff(thread, comments);

    if (diff > 10) {
      console.log(`${thread} 🡺 Has +10 (${diff}) new comments 🡺 General notification instead!`);
      await notification.generic(thread, comments, diff);
    }
    else if (diff > 0) {
      console.log(`${thread} 🡺 Has ${diff} new comments`);
      await get_comments_rss(thread, comments, diff);
    }

  }
}


var scanner = {
  // Constant scanner
  async scan(cap){
    let limit = Date.now() - cap * 1000 * 60 * 60;

    await subs.find({subscribed: {$gt: limit }})
      .forEach( async thread => {  
        await check_post.new_comments(thread._id, thread.comments);
      })
      // .then(console.log(`threads in database scanned`))
      .catch(error => console.error(error, cap));
  },

  // Call scanner frequenly.
  // hs = cap since subscription, interval = seconds between searchs
  async constant(selection){
    while (true){

      var hs;
      var interval = 1000;
  
      switch (selection){
        case 0:
          hs = prefs.prioHigh.age;
          interval *= prefs.prioHigh.poll;
          break;
        case 1:
          hs = prefs.prioMedium.age;
          interval *= prefs.prioMedium.poll;
          break;
        case 2:
          hs = prefs.prioLow.age;
          interval *= prefs.prioLow.poll;
          break;
      }
      // Delay start for lower priorities to avoid check same threads in same time
      if (hs > prefs.prioHigh.age) {await new Promise(r => setTimeout(r, 3000));}
      if (hs > prefs.prioMedium.age) {await new Promise(r => setTimeout(r, 3000));}

      console.log(`Constant search 🡺 ${hs}|${interval / 1000}`);
      await scanner.scan(hs);

      await new Promise(r => setTimeout(r, interval));
    }
  },

  async start(){
    // Start constant scanning
    // Lower number = higher prio
    this.constant(0);
    this.constant(1);
    this.constant(2);
  }
}


async function get_comments_rss(thread, saved_comments, new_comments){

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
          comments: (saved_comments + new_comments),
          check: Date.now()
        },
          (error) => {if (error) { throw error; }
        });

        notification.send(title, comment, author, permalink);
        await new Promise(r => setTimeout(r, 1000));

      }
    })
  });

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
      subscriptions.add(m.add);
    }

    // Remove a subscription
    if (m.remove) {
      subscriptions.remove(m.remove);
    }

    // When a thread is opened, scan it
    if (m.scan) {
      post.parse_json(m.scan);
    }
    
  });
}

// content.postMessage({scan:"_"});

chrome.runtime.onConnect.addListener(connected);

async function start(){
  await load_prefs();
  await subscriptions.clean_olds();
  scanner.start();
}
start();

var d = new Date();
var w = d.toLocaleTimeString();
console.log("Background js file loaded", w);
