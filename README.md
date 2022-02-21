# public-apps-ws

Simple example of a jambonz application that uses the websocket api.

## Overview

To support the jambonz websocket api the following helper classes and functions were added to the [jambonz node client](https://github.com/jambonz/jambonz-node):
- WsSession: a websocket session
- WsRouter: a utility class for routing URLs based on paths
- handleProtocols: a function that establishes the proper websocket subprotocol.

### Boilerplate

A typical main app.js file would use them as shown below:

```js
const {WebSocketServer} = require('ws');
const {WsRouter, WsSession, handleProtocols} = require('@jambonz/node-client');
const router = new WsRouter();
const logger = require('pino')();
const port = process.env.WS_PORT || 8080;
const wss = new WebSocketServer({ port, handleProtocols });

router.use(require('./lib/routes'));

wss.on('listening', () => {
  logger.info(`websocket server listening on port ${port}`);
});
wss.on('connection', (ws, req) => {
  new WsSession({logger, router, ws, req});
});
```

### Routes

With that as boilerplate, then you would just define your routes.  In this example, our main routing entrypoint is `lib/routes/index.js` which looks like this:

```js
const {WsRouter} = require('@jambonz/node-client');
const router = new WsRouter();

router.use('/hello-world', require('./hello-world'));
router.use('/simple-gather', require('./gather-test'));
router.use('/async-1', require('./async-1'));
router.use('/async-2', require('./async-2'));
router.use('/queues', require('./queues'));

module.exports = router;
```

### Endpoints
Your endpoints then do the work of responding to incoming messages.  Here is the simple 'hello, world' application when implemented using websockets

```js
const {WebhookResponse} = require('@jambonz/node-client');
const text = `<speak>
<prosody volume="loud">Hi there,</prosody> and welcome to jambones! 
jambones is the <sub alias="seapass">CPaaS</sub> designed with the needs
of communication service providers in mind.
This is an example of simple text-to-speech, but there is so much more you can do.
Try us out!
</speak>`;

module.exports = (ws) => {
  const {logger} = ws.locals;

  ws.on('session:new', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got session:new');
    const app = new WebhookResponse();
    app
      .tag({
        data: {
          foo: 'bar'
        }
      })
      .pause({length: 1.5})
      .say({
        text,
        synthesizer: {
          vendor: 'google',
          language: 'en-US'
        }
      });
    ws.ack(msgid, app);
  });

  ws.on('verb:hook', ({msgid, hook, payload}) => {
    logger.info({msgid, payload, hook}, 'got verb:hook');
    ws.ack(msgid);
  });

  ws.on('call:status', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got call:status');
  });

  ws.on('error', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got error');
  });

  ws.on('close', () => {
    logger.info('socket closed from jambonz, call ended');
  });
};
```

Note a few things:
- The endpoint is passed a Websocket instance.  This Websocket instance has been monkey patched to have two additional methods: `ack()` and `sendCommand()`.  In the example above, we only see the use of the `ack()` method.  
- The messages that jambonz sends over the websocket are emitted as events, with an event name of the jambonz message being sent.  The first message arriving on the socket will be a `session:new` type.
- `session:new` and `verb:hook` message types must be responded to with a `ws.ack()`.  The remaining message types do not require an `ws.ack()` (though it is harmless to call it in those cases as well).
- The websocket is held open for the length of the call, and closed by jambonz at the call end.  The socket should generally not be closed from the websocket server side.
- The signature for the `ws.ack()` is `ack(msgid, data)` where data is optional.  If supplied, data should be a set of new instructions for jambonz to process, in the form of either a `WebsocketResponse` instance or a plain JSON array.

### Sending asynchronous commands

The main reason to use the websocket api instead of webhooks is to make it easier for applications that want to send a lot of asynchronous commands; i.e. apps that want to change the call state in some way at times where there would be no webhook to respond to.  

Of course, the REST api can be used for that, but it is slightly easier to simply have a bi-directional websocket that you can send commands down at any time.  To do so, use the `ws.sendCommand()` method as shown below.


```js
const {WebhookResponse} = require('@jambonz/node-client');
const text = 'Hi there.  Please stay on the line.  In 5 seconds we will hang you up.';

module.exports = (ws) => {
  const {logger} = ws.locals;
  ws.on('session:new', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got session:new');
    const {call_sid} = payload;
    const app = new WebhookResponse();
    app
      .say({ text })
      .pause({length: 10});
    
    /* respond with the initial app */
    ws.ack(msgid, app);

    /* 5 secs later redirect to a new app */
    setTimeout(() => {
      const app = new WebhookResponse();
      app
        .say({text: 'And, just as promised, time to say goodbye.'})
        .hangup();
      ws.sendCommand('redirect', call_sid, app);
    }, 5000);
  });
  ws.on('call:status', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got call:status');
  });
  ws.on('error', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got error');
  });
  ws.on('close', () => {
    logger.info('socket closed from jambonz, call ended');
  });
};
```
