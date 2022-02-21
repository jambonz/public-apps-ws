const {WsRouter} = require('@jambonz/node-client');
const router = new WsRouter();

router.use('/enqueue-test', require('./enqueue'));

module.exports = router;
