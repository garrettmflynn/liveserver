import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExampleSelector from './selector';
import SessionsService from './../../../../src/services/sessions/sessions.service';
import DatabaseService from './../../../../src/services/database/database.service';
import UnsafeService from './../../../../src/services/unsafe/unsafe.service';

import OSCClient from './../../../../src/services/osc/osc.frontend';
import WebRTCClient from './../../../../src/services/webrtc/webrtc.frontend';
import HTTPClient from './../../../../src/services/http/http.frontend';
import WebsocketClient from './../../../../src/services/websocket/websocket.frontend';
import { Router } from './../../../../src/router/Router';
import { randomId } from '../../../../src/common/id.utils';

import {settings} from '../../../../src/server_settings.js'

let router = new Router()

const SERVER_URI = settings.protocol+"://"+settings.hosturl+":"+settings.port//(window.location.href.includes('localhost')) ? 'http://localhost:80' : 'http://localhost:80' // Replace with production server URI
const SERVER_URI_2 = settings.protocol+"://"+settings.hosturl+":"+settings.port2//(window.location.href.includes('localhost')) ? 'http://localhost:81' : 'http://localhost:81' // Replace with production server URI

let services = [
  new SessionsService(router), 
  new UnsafeService(router),
  new DatabaseService(router),

  new OSCClient(router), 
  new WebsocketClient(router), 
  new WebRTCClient(router), 
  new HTTPClient(router),
]

services.forEach(service => {
  router.load(service).then(() => {
    console.log(`${service.constructor.name} connected!`)
  })
})

const id = randomId()

const endpoints = []
const endpoint = router.connect({
  target: SERVER_URI,
  credentials: {id, _id: id}
})
endpoints.push(endpoint)
endpoints.push(router.connect({
  target: SERVER_URI_2,
  credentials: {id, _id: id}
}))


endpoint.send('http/add', {
  method: 'POST',
  message: ['/ssr/endpoint', '<p>Just some arbitrary HTML</p>']
})

router.post('http/add', '/ssr/router', '<p>Just some arbitrary HTML</p>')



export default function Examples() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | Examples`}
      description={`Examples for ${siteConfig.title}.`}>
      <ExampleSelector 
        server={SERVER_URI}
        endpoints={endpoints}
        router={router}
        id={id}
      />
    </Layout>
  );
}
