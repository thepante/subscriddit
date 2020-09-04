import WebSocket from 'ws';
import config from './config.js';
import * as manager from './manager.js';

const port = config.get('server.ws.port', 8080);
const wss = new WebSocket.Server({ port: port });

wss.on('connection', (ws, req) => {
  console.log('WS client connected:', req.socket.remoteFamily, req.socket.remoteAddress);
  console.log('  Client user-agent:', req.headers['user-agent']);
  console.log('      Client origin:', req.headers.origin);
  // console.warn(req)
  ws.on('message', handleReq);
});

/**
 * Handles incoming requests from clients
 * @param {JSON} incoming - Received message from client
 * @return {function} Response to all connected WS clients
 */
const handleReq = (incoming) => {
  if (config.get('logs.requests')) console.log('WS request →', incoming);
  const data = JSON.parse(incoming);
  let response;

  if (data.status) {
    let status = manager.getSubscriptionStatus(data.status);
    console.log(data.status, '→ status', status);
    response = {status: status};
  }
  else if (data.remove) {
    let remove = manager.removeSubscription(data.remove);
    console.log(data.remove, '→ removed', remove);
    response = {status: !remove};
  }
  else if (data.add) {
    let add = manager.addSubscription(data.add);
    console.log(data.add.id, '→ added:', add);
    response = {status: add};
  }
  else if (data.subscriptions) {
    let subscriptions = manager.getSubscriptions(data.subscriptions, Date.now());
    console.log(data.subscriptions, '→ subscriptions sent', subscriptions.length);
    response = {subscriptions: subscriptions};
  }
  else if (data.svdetails) {
    response = {
      svdetails: {
        name: config.get('server.name')
      }
    };
  }
  else {
    console.log("ERROR → Incoming data wasn't valid");
    console.log("      →", JSON.stringify(data));
    response = {error: "Server didn't received data"};
  }

  if (data.origin) response.origin = data.origin;
  return sendtoClients(response);
}

/**
 * Send a message to all connected websocket clients
 * @param {object} data - Object message to send
 * @return {void}
 */
export const sendtoClients = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export const liveConnectedClients = () => wss.clients.size;

console.log('WebSocket Server listening on port', port);
