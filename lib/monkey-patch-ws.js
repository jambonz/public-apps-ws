const assert = require('assert');
const Websocket = require('ws');

module.exports = (ws, {logger, req}) => {
  assert(ws instanceof Websocket);
  ws.locals = {logger, req, url: req.url, originalUrl: req.url};

  /* helper for sending an ack to jambonz */
  ws.ack = (msgid, res) => {
    let msg = {
      type: 'ack',
      msgid
    };
    if (res) msg = {...msg, data: res};
    try {
      logger.info({msg}, 'sending ack');
      ws.send(JSON.stringify(msg));
    } catch (err) {
      logger.error({err}, 'Error sending ack to jambonz');
    }
  };

  ws.sendCommand = (command, call_sid, payload) => {
    assert.ok(typeof call_sid === 'string', 'invalid or missing call_sid');
    assert.ok(typeof payload === 'object' && Object.keys(payload).length > 0,
      'invalid or missing payload');
    //TODO: validate command

    const msg = {
      type: command,
      call_sid,
      data: payload
    };
    try {
      logger.info({msg}, 'sending command');
      ws.send(JSON.stringify(msg));
    } catch (err) {
      logger.error({err}, `Error sending command ${command} to jambonz`);
    }
  };
};