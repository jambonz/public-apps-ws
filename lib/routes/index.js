const Router = require('../router');
const router = new Router();

router.use('/hello-world', require('./hello-world'));
router.use('/simple-gather', require('./gather-test'));
router.use('/queues', require('./queues'));

module.exports = router;
