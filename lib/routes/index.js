const {WsRouter} = require('@jambonz/node-client');
const router = new WsRouter();

router.use('/hello-world', require('./hello-world'));
router.use('/simple-gather', require('./gather-test'));
router.use('/async-1', require('./async-1'));
router.use('/async-2', require('./async-2'));
router.use('/queues', require('./queues'));

module.exports = router;
