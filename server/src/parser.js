import fetch from 'node-fetch';
import { transform } from 'camaro';
import { getSubscriptionNumComments } from './manager.js';
import config from './config.js';


// Parser should just deal with fetching data from internet

const useragent = () => {
  Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
  }
  const bn = ['Firefox', 'Chrome', 'Chromium'].random();
  const bv = Math.floor(Math.random() * (80 - 58 + 1) + 58);
  const ua = `Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:79.0) Gecko/20100101 ${bn}/${bv}.0`;
  return ua;
}


/**
 * Get data from the reddit API.
 * @param {string} threadID - Submission ID
 * @param {string} method - Valid options: `json`, `xml`
 * @param {booleean} pushshift - If is from pushift API (only json)
 * @return {object} Object with submission data
 */
const parser = async (format, threadID, pushshift) => {
  const headers = {'User-Agent': useragent()};
  const cap = 1000;
  let isjson = undefined;
  let link;

  if (format === 'json') {
    link = (pushshift) ? 'https://api.pushshift.io/reddit/search/submission/?ids='
                       : 'https://www.reddit.com/api/info.json?id=t3_';
    link += threadID;
    isjson = true;
  } else if (format === 'xml') {
    link = `https://www.reddit.com/${threadID}.rss?t=week&sort=new&limit=${cap}`;
    isjson = false;
  } else {
    return "Invalid method";
  }

  var load = {};
  await fetch(link, {'headers': headers})
    .then(response => {
      if (response.ok && isjson) {
        return response.json();
      } else if (response.ok) {
        return response.text();
      } else {
        throw Error(response.statusText);
      }
    })
    .then(function(response) {
      load.status = 'ok';
      if (pushshift) {
        load.data = response['data'];
      }
      else if (isjson) {
        load.data = response['data']['children'][0]['data'];
      } else {
        load.data = response;
      }
      return load;
    })
    .catch(function(error) {
      load.status = 'error';
      load.data = error;
      return load;
    });

  if (isjson) {
    return load;
  } else {
    const template = ['/feed/entry', {
      id: 'id',
      author: 'author/name',
      content: 'content',
      updated: 'updated'
    }];

    let entries = await transform(load.data, template)
      .catch(err => {
        console.warn("ERROR CAMARO", load.data) // TODO
        console.log(err);
        entries = [];
      });
    console.warn(entries == 0, entries.length)
    return entries;
  }
}


/**
 * Get number of comments of given submission.
 * @param {string} threadID - Submission ID
 * @return {number} Number of comments
 */
export const getNumComments = async (threadID) => {
  // console.log(`getNumComments getting from ${threadID}...`);
  const data = await parser('json', threadID);
  return (data.status === 'ok') ? Number(data.data['num_comments']) : -1;
}


/**
 * Gives the difference in the number of current vs saved comments.
 * @param {string} threadID - Submission ID
 * @return {number} Difference
 */
export const getDiffComments = async (threadID) => {
  const storedNumComments = await getSubscriptionNumComments(threadID);
  const actualNumComments = await getNumComments(threadID);
  return (actualNumComments != -1) ? actualNumComments - storedNumComments : 0;
}

/**
 * Gives the difference in the number of current on Pushshift API vs saved comments.
 * @param {string} threadID - Submission ID
 * @return {number} Difference
 */
export const getPushshiftNumComments = async (threadID) => {
  const data = await parser('json', threadID, true);
  return (data.status === 'ok') ? Number(data.data[0]['num_comments']) : -1;
}


/**
 * Parse submission data when the 'front-end' isn't the deliver of commands.
 * This function should be used only for interactions from the CLI.
 * @param {string} threadID - Submission ID
 * @return {object} Submission data
 */
export const getSubmissionData = async (threadID) => {
  console.log(`Parsing data for submission ID ${threadID}`);
  const data = await parser('json', threadID);
  let submission = {};
  if (data.status === 'ok'){
    submission = {
      id: threadID,
      num_comments: data.data['num_comments'],
      title: data.data['title'],
      sub: data.data['subreddit_name_prefixed'],
      checked: Date.now()
    };
  } else {
    console.log(data.status);
    submission = data.status;
  }
  return submission;
}


/**
 * Get and parse all the comments requested that are newer that `since`.
 *
 * Returning object:
 * ```
    {
      removed: Number,
      comments: Array,
      newertime: Number,
    }
  ```
 *
 * The `amount` specifies the number of comments wanted to return parsed. While
 * `since` is used to detect those newer comments since that specified timestamp.
 * @param {string} threadID - Submission ID
 * @param {number} amount - Excepted number of comments to parse
 * @param {number} since - Should be `checked` timestamp of the subscription
 * @return {object} N removed comments, array of comments `[id, author, content]`, timestamp of most recent collected comment
 */
export const parseComments = async (threadID, amount, since) => {
  let entries = await parser('xml', threadID);

  if(entries.length < 1) {
    console.log("parseComments GOT NO ENTRIES. Skipping...")
    return;
  }

  entries.splice(0, 1); // removes the submission entry (isn't a comment)

  let comments = [];
  let collected = 0;
  let ignoredCount = 0;
  let latestCommentTime = since;

  let htmlTag = /( |<([^>]+)>)/ig;

  for (let i = 0; i < entries.length; i++) {
    let updated = Date.parse(entries[i].updated);
    let author = entries[i].author = entries[i].author.substr(1);
    let content = entries[i].content = entries[i].content.replace(htmlTag, " ").trim();
    let removed = content === '[deleted]' || content === '[removed]';
    let ignoredUsers = config.get('ignored');
    let ignored = ignoredUsers.includes(author.slice(2));

    // console.warn(entries[i].id, removed, updated, '<', since, '=', updated < since)

    if (updated < since) continue;
    if (updated > latestCommentTime) latestCommentTime = updated;

    if (removed || ignored) {
      ignoredCount++;
      continue;
    }

    if (content.length > 200) content = content.substring(0, 200) + "...";

    const comment = [
      entries[i].id.slice(3),
      author,
      content.replace(/\s+/g, ' ')
    ];

    comments.push(comment);
    collected++;

    if (collected === amount) break;
  };

  return {ignored: ignoredCount, comments: comments, newertime: latestCommentTime};
}
