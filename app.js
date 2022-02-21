const opts = Object.assign({
  timestamp: () => `, "time": "${new Date().toISOString()}"`,
  level: process.env.LOGLEVEL || 'info'
});
const logger = require('pino')(opts);
const {WebSocketServer} = require('ws');
const WsSession = require('./lib/ws-session');
const port = process.env.WS_PORT || 8080;
const Router = require('./lib/router');

const handleProtocols = (protocols) => {
  if (!protocols.has('ws.jambonz.org')) return false;
  return 'ws.jambonz.org';
};

const wss = new WebSocketServer({ port, handleProtocols });

const router = new Router();
router.set(require('./lib/routes'));

wss
  .on('listening', () => {
    logger.info(`websocket server listening on port ${port}`);
  })
  .on('connection', (ws, req) => {
    new WsSession(logger, router, ws, req);
  });
