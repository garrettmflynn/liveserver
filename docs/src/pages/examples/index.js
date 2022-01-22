import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExampleSelector from './selector';
import { OSCClient, SessionsClient, UserPlatform, WebsocketClient } from '../../../../src/frontend';

const SERVER_URI = (window.location.href.includes('localhost')) ? 'http://localhost:80' : 'http://localhost:80' // Replace with production server URI
const platform = new UserPlatform();

let services = [new SessionsClient(), new OSCClient(), new WebsocketClient]
services.forEach(service => {
  platform.connect(service).then(() => {
    console.log('Service connected!', service)
  })
})

platform.setRemote(SERVER_URI)

export default function Examples() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | Examples`}
      description={`Examples for ${siteConfig.title}.`}>
      <ExampleSelector 
        server={SERVER_URI}
        platform={platform}
      />
    </Layout>
  );
}
