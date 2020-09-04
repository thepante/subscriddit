import express from 'express';
import config from './config.js';
import * as manager from './manager.js';

const port = config.get('server.http.port', 3000);
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  // console.log(req.headers);
  console.log("HTTP Ping → User-Agent:", req.headers['user-agent']);
  res.sendStatus(200);
});

// Handle request data or remove actions ... YEP, remove through GET IK...
app.get('/:request/:param', (req, res) => {
  // console.log(req.params);
  const requested = req.params.request;
  const item = req.params.param;

  let response;
  switch (true) {
    case (requested === 'status'):
      response = manager.getSubscriptionStatus(item);
      console.log(item, '→ status', response);
      return res.send({status: response});

    case (requested === 'remove'):
      response = manager.removeSubscription(item);
      console.log(item, '→ removed', response);
      return res.send({status: !response});

    case (requested === 'subscriptions'):
      response = manager.getSubscriptions(item, Date.now());
      console.log(item, '→ subscriptions sent', response.length);
      return res.send({[requested]: response});

    default:
      return res.sendStatus(400);
  };
});


// Handle adding subscriptions or updating server settings
app.post('/', function(req, res){
  // console.log(req.body);
  if ('add' in req.body) {
    let add = manager.addSubscription(req.body.add);
    console.log(req.body.add.id, '→ added:', add);
    res.send({status: add});
  }
  else { // TODO: setting/updating server preferences
    // res.send("Invalid POST request");
    res.status(400).send("Invalid POST request. Check the docs");
    console.log(Object.keys(req.body), '→', res.statusCode);
  }
});

app.listen(port, () => console.log('HTTP Server listening on port', port))
