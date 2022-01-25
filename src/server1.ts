import main from './main'
main('80', {
  http: true,
  websocket: true,

  webrtc: true,
  osc: true,
  
  ssr:true,
  database: true,
  sessions: true,
  unsafe: true,
})