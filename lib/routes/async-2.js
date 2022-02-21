const {WebhookResponse} = require('@jambonz/node-client');
const text = 'Hi there.  Please stay on the line.  In 5 seconds we will hang you up.';

module.exports = (ws) => {
  const {logger} = ws.locals;
  ws.on('session:new', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got session:new');
    const {call_sid} = payload;
    const app = new WebhookResponse();
    app
      .say({
        text,
        synthesizer: {
          vendor: 'google',
          language: 'en-US'
        }
      })
      .pause({length: 10});
    ws.ack(msgid, app);

    setTimeout(() => {
      const app = new WebhookResponse();
      app
        .say({text: 'And, just as promised, time to say goodbye.'})
        .hangup();
      ws.sendCommand('redirect', call_sid, {
        parent_call: app.toJSON()
      });
    }, 7000);
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
