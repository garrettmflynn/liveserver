import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExampleSelector from './selector';
import { SessionsService } from './../../../../src/services/sessions/sessions.service';
import { DatabaseService } from './../../../../src/services/database/database.service';
import { UnsafeService } from './../../../../src/services/unsafe/unsafe.service';

import { OSCClient } from './../../../../src/services/osc/osc.frontend';
import { WebRTCClient } from './../../../../src/services/webrtc/webrtc.frontend';
import { HTTPClient } from './../../../../src/services/http/http.frontend';
import { WebsocketClient } from './../../../../src/services/websocket/websocket.frontend';
import { Router } from './../../../../src/router/Router';

let router = new Router()

const SERVER_URI = (window.location.href.includes('localhost')) ? 'http://localhost:80' : 'http://localhost:80' // Replace with production server URI
const SERVER_URI_2 = (window.location.href.includes('localhost')) ? 'http://localhost:81' : 'http://localhost:81' // Replace with production server URI

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

const endpoints = []
endpoints.push(router.connect(SERVER_URI))
endpoints.push(router.connect(SERVER_URI_2))

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
      />
    </Layout>
  );
}
