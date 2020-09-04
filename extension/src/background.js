require("regenerator-runtime/runtime");

let prefs = {
  serverAddress: 'localhost:8080',
  load() {
    chrome.storage.local.get(null, (options) => {
      // prefs.serverAddress = (options.serverAddress) ? options.serverAddress : prefs.serverAddress;
      if (options.serverAddress) {
        prefs.serverAddress = options.serverAddress;
        console.log("Loaded saved settings");
      } else {
        console.log("Applied default settings");
      }
      (socket) ? socket.close() : initWS();
    });
  },
};

prefs.load();


// Notifications
var notification = {
  show(content) {
    let message = undefined;
    let title;
    if (content.content > 1) {
      title = `New comments on "${content.title}"`;
      message = `There are ${content.content} new comments in the submission "${content.title}"`;
    } else {
      title = `${content.author} commented on "${content.title}"`;
      message = content.content;
    }

    chrome.notifications.create(content.link, {
      title: title,
      message: message,
      iconUrl: "./48.png",
      type: "basic",
      // requireInteraction: true
    });
  },
};

// Listen for notification click
chrome.notifications.onClicked.addListener(function (permalink) {
  chrome.tabs.create({ url: permalink });
});


// Messages incoming from app
var socket;
function initWS() {
  const socketMessageListener = (incoming) => {
    let data = JSON.parse(incoming.data);

    if (data.log) {
      console.log(data.log);
    }
    else if (data.notification) {
      console.log("Notification received →", data.notification.link);
      notification.show(data.notification);
    }
    else {
      console.log("Response from server", data);
      chrome.tabs.sendMessage(data.origin, data);
    }
  };

  // On open connection
  const socketOpenListener = (event) => {
    console.log(`Connected to Subscriddit server [${event.srcElement.url}]`);
  };

  // When closed connection
  const socketCloseListener = async (event) => {
    if (socket) console.error('Disconnected. Code', event.code);

    socket = new WebSocket('ws://' + prefs.serverAddress);
    socket.addEventListener('open', socketOpenListener);
    socket.addEventListener('message', socketMessageListener);
    socket.addEventListener('close', socketCloseListener);

    socket.sendmessage = async function(msg) {
      while (this.readyState === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
      this.send(JSON.stringify(msg));
    };
  };
  socketCloseListener();
}


// Bridge content -> app
var content;
function connected(p) {
  content = p;
  content.onMessage.addListener(async function (request, s) {
    let origin = s.sender.tab.id; // to know where (tab) to send back the response
    let serverRequest = ['status', 'add', 'remove', 'subscriptions'];
    console.log("Background received:", request);

    if (serverRequest.includes(Object.keys(request)[0])) {
      request.origin = origin;
      socket.sendmessage(request);
      // socket.send(JSON.stringify(request));
    }

    if (request.load_prefs) prefs.load();
  });
}
chrome.runtime.onConnect.addListener(connected);

console.log("Background loaded");
