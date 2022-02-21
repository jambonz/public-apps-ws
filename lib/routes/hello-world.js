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
