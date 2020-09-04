import config from './config.js';
import fetch from 'node-fetch';
import { sendtoClients } from './server-ws.js';

// Notifier just send notifications via enabled options

/**
 * Request to send a notification via each method enabled in user preferences.
 * ```
  {
    submission: [ID, SUB, TITLE],
    comment: [ID, AUTHOR, COMMENT]
  }
  ```
 * @param {array} data - Notification object as specified in description
 */
export const sendNotification = async (data) => {
  const sub = (data.submission[1].startsWith("r/")) ? data.submission[1] : 'r/' + data.submission[1];
  const thread = data.submission[0];
  const title = data.submission[2];
  const commid = data.comment[0];
  const params = 'sort=new&context=1&depth=3';

  const permalink = `https://www.reddit.com/${sub}/comments/${thread}/_/${commid}/?${params}`;

  const notifContent = {
    title: title,
    author: data.comment[1],
    content: data.comment[2],
    link: permalink
  }

  // let methodsUsed = [];

  if (config.get('notifications.websocket')) {
    sendtoClients({notification: notifContent});
    // methodsUsed.push("WS connected clients");
  }

  if (config.get('notifications.osnative')) {
    // TODO
    // methodsUsed.push("OS native");
  }

  if (config.get('ifttt.enabled') && config.get('ifttt.webhooksKey')) {
    ifttt(notifContent);
    // methodsUsed.push("IFTTT");
  }

  if (config.get('notifications.console')) {
    console.warn(notifContent);
  }

  // console.log(`${thread} → ${commid} → ${(methodsUsed.length > 0) ? 'Notified through: ' + methodsUsed : 'NOT NOTIFIED: No methods enabled!'}`);
}


/**
 * Trigger notification through IFTTT.
 * Makes a POST request.
 * @param {object} content - Notification content ready to deliver
 */
const ifttt = (data) => {
  const WHKEY = config.get('ifttt.webhooksKey');
  const url = `https://maker.ifttt.com/trigger/new_comment/with/key/${WHKEY}`;
  let content;

  if (config.get('ifttt.preFormated')) {
    content = {
      value1: `<a href="${data.link}">${data.title}</a><br>${data.content}<br><code>---</code><br><code>${data.author}</code>`
    };
  } else {
    content = {
      value1: data.title,
      value2: data.content,
      value3: data.link
    }
  };

  fetch(url, {
    method: 'post',
    body: JSON.stringify(content),
    headers: { 'Content-Type': 'application/json' },
  })
  .then(res => {
    console.log(res.status);
  });
}
