import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExampleSelector from './selector';
import { UserPlatform } from '../../../../src/frontend';

const SERVER_URI = (window.location.href.includes('localhost')) ? 'http://localhost:80' : 'http://localhost:80' // Replace with production server URI
const platform = new UserPlatform({
  _id:'123456', //we are using randomly generated ones from realm/mongodb
  username:'johnnyboi',
  email:'johnnyboi@boyo.com',
  firstName:'johnny',
  lastName:'boyo',
  test: ['what']
});

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
