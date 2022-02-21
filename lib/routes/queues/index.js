const Router = require('../../router');
const router = new Router();

router.use('/enqueue-test', require('./enqueue'));

module.exports = router;
