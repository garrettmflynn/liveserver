const {Router} = require('./src/router/dist/index.js')
const liveserver = require('./src/backend/dist/index.js')

const router = new Router()
let httpService = new liveserver.HTTPBackend()
router.load(httpService, 'http')

