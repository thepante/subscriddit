import config from './config.js';
import { getSubscriptions, updateSubscriptionComments, cleanOldSubscriptions } from './manager.js';
import { getDiffComments, parseComments, getNumComments, getPushshiftNumComments } from './parser.js';
import { sendNotification } from './notifier.js';
import { liveConnectedClients } from './server-ws.js';

// Scanner is the worker that watch for new comments in the subscriptions at database

/**
 * Scan the given subscription.
 * @param {string} threadID - Submission ID
 * @return {boolean} Success
 */
const scanSubscription = (threadID) => {
  return undefined;
}


/**
 * Scan every subscription in database.
 * @param {number} hs - Hours since subscribed
 * @param {number} cap - Scan subscriptions until this indicated time
 */
export const scanDatabase = async (hs, cap) => {
  const rightNow = Date.now();
  const since = rightNow - (hs * 3600_000);
  const until = rightNow - (cap * 3600_000);
  const subscriptions = getSubscriptions(since, until);

  if (config.get('logs.scans')) console.log(`[${since}] scan: ${hs}hs, found:`, subscriptions.length);

  for (let i = 0; i < subscriptions.length; i++) {
    const threadID = subscriptions[i]['id'];
    const checked = subscriptions[i]['checked'];
    const commentsDiff = await getDiffComments(threadID);

    if (commentsDiff < 1) continue;

    console.log(threadID, '→ Detected', (commentsDiff > 1) ? commentsDiff + ' new comments' : 'a new comment');

    const scannedEntries = await parseComments(threadID, commentsDiff, checked);
    const newCommentsAmount = commentsDiff - scannedEntries.removed;
    const comments = scannedEntries.comments;
    const wereAllIgnored = scannedEntries.ignored === commentsDiff;

    // debugging...
    if (wereAllIgnored) {
      console.log(threadID, `→ New comment${(scannedEntries.ignored > 1) ? 's' : ''} got ignored - Were removed or by ignored authors:`, scannedEntries.ignored);
    }
    else if (comments.length < commentsDiff) {
      const pushshiftNC = await getPushshiftNumComments(threadID);
      const redditNC = await getNumComments(threadID);
      const detectedInvisibleComments = pushshiftNC > redditNC;

      console.log(threadID, `→ Collected (${comments.length}) doesnt match to diff (${commentsDiff}). Analyzing:`);
      console.log(threadID, `→ Comments count on APIs: [Reddit: ${redditNC}] < [Pushshift: ${pushshiftNC}] = ${detectedInvisibleComments}`);

      if (detectedInvisibleComments) {
        console.log(threadID, '→ DETECTED NOT MORE VISIBLE COMMENT/S:', pushshiftNC - redditNC);
      } else {
        console.log(threadID, `→ Got [${comments.length}/${commentsDiff}] - Next scan should handle it...`);
      }
    }

    if (liveConnectedClients() > 0 || config.get('notifications.console') || (config.get('ifttt.enabled') && config.get('ifttt.webhooksKey'))) {}
    else {
      console.log(threadID, '→ No avalaible methods to send the notification. Skipping update and notification...');
      continue;
    }

    if (comments.length > 0 || wereAllIgnored) {
      const commentsToAdd = (wereAllIgnored) ? scannedEntries.ignored : comments.length;
      const newTotalComments = subscriptions[i]['num_comments'] + commentsToAdd;
      updateSubscriptionComments(threadID, newTotalComments, scannedEntries.newertime + 1);
      console.log(threadID, "→ Updated num_comments:", newTotalComments);
    }

    // send notifications
    for (let x = 0; x < comments.length; x++) {
      const data = {
        submission: [threadID, subscriptions[i].sub, subscriptions[i].title],
        comment: comments[x]
      }
      await sendNotification(data);
    };

  };

}


/**
 * Scans the database constantly as indicated by setted preferences.
 */
export const scanConstantly = async () => {

  /**
   * Do a constant scan for a given priority
   * @param index Index of prio in `config.scan` array (delay based on this)
   * @param since Hours since subscriptions apply to this prio
   * @param until Hours until subscriptions apply to this prio
   * @param poll Poll rate for this priority. Scanning ratio
   */
  const init = async (index, since, until, poll) => {
    while (true){
      let interval = 1000 * poll;

      // Remove olders subscriptions
      cleanOldSubscriptions(config.get('hsAutoUnsub'));

      // Delay low priorities scanning to avoid same time checkings
      await new Promise(r => setTimeout(r, 1000 * (index*3)));

      // console.log(`Got search → ${since}|${poll}`);
      await scanDatabase(since, until);

      // console.log("PERIOD IS:", since, until);
      await new Promise(r => setTimeout(r, interval));
    }
  }

  /** Returns previous enabled cap hours */
  const findEnabledPrev = (index) => {
    let scan = config.get('scan');
    for (let i = index-1; i > -2; i--) {
      if (scan[i] && scan[i][0]) {
        return scan[i][1];
      }
    };
    return 0;
  }

  /** If priority is enabled starts a constant scan for it */
  const startIfEnabled = (prio, i) => {
    if (prio[0]){
      const since = prio[1];
      const until = findEnabledPrev(i);
      const poll = prio[2];

      console.log('Enabled scan['+i+']:', since, '←→', until, '· every', poll, 'seconds');
      init(i, since, until, poll);
    }
  };

  // Iterates over priority array and starts each enabled one
  config.get('scan').forEach(startIfEnabled);
}
