import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExampleSelector from './selector';
import { OSCClient } from 'liveserver-osc';
import { SessionsClient} from 'liveserver-sessions';
import { WebRTCClient } from 'liveserver-webrtc';
import { DatabaseClient } from 'liveserver-database';
import { UnsafeClient } from 'liveserver-unsafe';
import { HTTPClient, WebsocketClient } from 'liveserver-frontend';
import router from 'liveserver-router';

const SERVER_URI = (window.location.href.includes('localhost')) ? 'http://localhost:80' : 'http://localhost:80' // Replace with production server URI
const SERVER_URI_2 = (window.location.href.includes('localhost')) ? 'http://localhost:81' : 'http://localhost:81' // Replace with production server URI

let services = [
  new SessionsClient(), 
  new OSCClient(), 
  new WebsocketClient(), 
  new WebRTCClient(), 
  new HTTPClient(),
  new DatabaseClient(),
  new UnsafeClient()
]

services.forEach(service => {
  router.connect(service).then(() => {
    console.log('Service connected!', service)
  })
})

const endpointIds = []
endpointIds.push(router.addRemote(SERVER_URI))
endpointIds.push(router.addRemote(SERVER_URI_2))

export default function Examples() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | Examples`}
      description={`Examples for ${siteConfig.title}.`}>
      <ExampleSelector 
        server={SERVER_URI}
        endpointIds={endpointIds}
        router={router}
      />
    </Layout>
  );
}
