import main from './main'
import {settings} from 'server_settings.js'

main(settings.port2, {
  websocket: true,
  webrtc: true
})