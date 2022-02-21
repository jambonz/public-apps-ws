const {WebhookResponse} = require('@jambonz/node-client');
const text = 'Hi there.  Please say something and I will try to transcribe it for you';


module.exports = (ws) => {
  const {logger} = ws.locals;
  ws.on('session:new', ({msgid, payload}) => {
    logger.info({msgid, payload}, 'got session:new');
    const app = new WebhookResponse();
    app
      .play({url: 'silence_stream://1000'})
      .gather({
        input: ['speech'],
        actionHook: '/gather/action',
        timeout: 10,
        say: { text },
        recognizer: {
          vendor: 'default',
          language: 'default',
          vad: {
            enable: true,
            mode: 2
          }
        }
      })
      .redirect({actionHook: '/gather'});
    ws.ack(msgid, app);
  });

  ws.on('verb:hook', ({msgid, hook, payload}) => {
    logger.info({msgid, payload, hook}, 'got verb:hook');
    let app;
    if (hook === '/gather/action') {
      app = new WebhookResponse();
      if (payload.speech) {
        app
          .say({text: `You said: ${payload.speech.alternatives[0].transcript}`})
          .play({url: 'silence_stream://1000'})
          .gather({
            input: ['speech'],
            actionHook: '/gather/action',
            timeout: 10,
            say: { text },
            recognizer: {
              vendor: 'default',
              language: 'default',
              vad: {
                enable: true,
                mode: 2
              }
            }
          });
      }
      app.redirect({actionHook: '/gather'});
    }
    ws.ack(msgid, app);
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
