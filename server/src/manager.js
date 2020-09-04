import db from 'diskdb';

// Manager should just handle database interactions

// Connect subscriptions database
db.connect('./', ['subscriptions']);

/**
 * Retrieves submissions in database that are newer that specified timestamp.
 * @param {number} since - Timestamp from
 * @param {number} until - Timestamp until
 * @return {array} Array of subscriptions
 */
export const getSubscriptions = (since, until) => {
  let subscriptions = db.subscriptions.find();

  // collect subscriptions that are newer that 'since'
  let collection = [];
  for (let i = 0; i < subscriptions.length; i++) {
    // if in correct time period then collect this one
    if (subscriptions[i].time > since && subscriptions[i].time < until) {
      // remove database own identificator
      delete subscriptions[i]._id;
      collection.push(subscriptions[i]);
    }
  }

  // console.log(subscriptions.length, "→", collection.length);
  return collection;
}


/**
 * Receives a submission object:
 * ```
    {
      id: String,
      num_comments: Number,
      sub: String,
      title: String,
      checked: Number,
    }
  ```
 * @param {object} submission - Submission data
 * @return {boolean} Success
 */
export const addSubscription = (submission) => {
  submission['time'] = Date.now();
  let add = db.subscriptions.update({id: submission.id}, submission, {upsert: true});
  return add.inserted > 0;
}

/**
 * Removes an indicated submission in database.
 * @param {string} threadID - Submission ID
 * @return {boolean} Success
 */
export const removeSubscription = (threadID) => {
  db.subscriptions.remove({id : threadID}, false);
  let check = db.subscriptions.findOne({id : threadID});
  return check === undefined;
}


/**
 * Get the saved number of comments in database for that given subscription.
 * @param {string} threadID - Submission ID
 * @return {number} Number of comments
 */
export const getSubscriptionNumComments = (threadID) => {
  let subscription = db.subscriptions.findOne({id : threadID});
  if (subscription != undefined) {
    return subscription.num_comments;
  } else {
    // if fails to get the data, 0 ensures to check again in next scanning
    return 0;
  }
}


/**
 * Get the subscription status for that given submission.
 * @param {string} threadID - Submission ID
 * @return {boolean} Subscribed or not
 */
export const getSubscriptionStatus = (threadID) => {
  let subscription = db.subscriptions.findOne({id : threadID});
  return subscription != undefined;
}


/**
 * Update the stored number of comments of that subscription.
 * @param {string} threadID - Submission ID
 * @param {number} comments - New TOTAL comments number
 * @param {number} time - if needed, timestamp of latest comment collected
 * @return {boolean} Success
 */
export const updateSubscriptionComments = (threadID, comments, time) => {
  db.subscriptions.update({id: threadID}, {
    num_comments: comments,
    checked: (time) ? time : Date.now()
  });
  let subscription = db.subscriptions.findOne({id : threadID});
  return subscription.num_comments === comments;
}


/**
 * Removes old subscriptions in database.
 * @param {string} hs - Hours since a subscription is considered old
 * @return {boolean} Success
 */
export const cleanOldSubscriptions = (hs) => {
  const subscriptions = db.subscriptions.find();
  const rightNow = Date.now();
  const limit = rightNow - (hs * 3600_000);
  let count = 0;

  for (let i = 0; i < subscriptions.length; i++) {
    if (subscriptions[i].time < limit) {
      db.subscriptions.remove({id: subscriptions[i].id});
      count++;
    }
  }

  if (count > 0) {
    console.log(`Autoremoved ${count} subcription${(count > 1) ? 's' : ''}`);
  }

  return;
}

