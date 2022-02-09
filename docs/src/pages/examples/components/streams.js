import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from '../examples.module.css'
import { Volume } from '../../../../libraries/brainsatplay-components/dist/module.js';
// import RouteDisplay from '../routeDisplay';
import * as  datastreams from '../../../../libraries/datastreams-api/dist/module.js'

export default function StreamsExample({ server, endpoints, router, id }) {

  const output = useRef(null);
  const start = useRef(null);
  const video = useRef(null);
  const audio = useRef(null);

  // const audio = useRef(null);


  useEffect(async () => {

    const volume = new Volume()
    audio.current.insertAdjacentElement('beforeend', volume)

    // const datastreams = await import('datastreams-api')
    console.log(datastreams)
    const dataDevices = new datastreams.DataDevices()

    dataDevices.getSupportedDevices().then((devices) => {

      console.log('Supported Devices', devices)

    })

    const start = document.createElement('button')
    start.click() 
      
      
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {

        // TODO: Fix DataStreams-API for Audio
        const context = new AudioContext();
        var analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.2;
        analyser.fftSize = 1024;
        analyser.minDecibels = -127;
        analyser.maxDecibels = 0;

        var filterNode = context.createBiquadFilter();
        // filterNode.type = 'highpass';
        // filterNode.frequency.value = 7000;

        var gainNode = context.createGain(); // Create a gain node to change audio volume.
        // gainNode.gain.value = 1.0;  

        const microphone = context.createMediaStreamSource(stream);
        microphone.connect(filterNode);
        filterNode.connect(gainNode);
        // microphone.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(context.destination);

        stream.onended = () => {
          microphone.disconnect();
          gainNode.disconnect();
          filterNode.disconnect()
      }

        // Show Audio Volume
        let volumeCallback = null;
        let volumeInterval = null;
        const volumes = new Uint8Array(analyser.frequencyBinCount);
        volumeCallback = () => {
          analyser.getByteFrequencyData(volumes);
          let volumeSum = 0;
          for(const volume of volumes)
            volumeSum += volume;
          const averageVolume = volumeSum / volumes.length;
          // volume.volume = (averageVolume / (analyser.maxDecibels - analyser.minDecibels))
        };

        if(volumeCallback !== null && volumeInterval === null) volumeInterval = setInterval(volumeCallback, 100);
      })

      dataDevices.getUserStream({ video: true }).then((stream) => {
        video.current.srcObject = stream
        video.current.autoplay = true
      }).catch(console.error)

      dataDevices.getUserStream({ dummy: true }).then((stream) => {

        console.log('Data', stream, stream.getDataTracks()[0])
        
      }).catch(console.error)

    // }


  }, []);

  return (
    <header className={clsx('hero hero--primary')}>
      <div className={'container'}>
        <div className={styles.conference}>
          <video ref={video} className={styles.video}></video>
          <div ref={audio}>
          </div>
        </div>
        <div className={styles.terminal}><span ref={output}></span></div>
      </div>
    </header>
  );
}
