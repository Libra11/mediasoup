<!--
 * @Author: Libra
 * @Date: 2023-04-26 18:50:03
 * @LastEditTime: 2023-04-28 15:41:05
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div class="video-container">
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { io } from 'socket.io-client';
import * as mediaSoupClient from 'mediasoup-client'

const socket = io('https://localhost:5000', {
  path: '/libra',
  query: {
    roomId: '123',
    userName: `Libra2`
  },
});
let consumerTransport;
let consumer;
async function socketPromise(socket, event, data) {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (res, error) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}

onMounted(async () => {
  const routerRtpCapabilities = await socketPromise(socket, 'getRouterRtpCapabilities');
  console.log('routerRtpCapabilities', routerRtpCapabilities);
  const device = new mediaSoupClient.Device();
  await device.load({ routerRtpCapabilities: routerRtpCapabilities });
  console.log('device', device);
  
  const transportParams = await socketPromise(socket, 'createWebRtcTransport', {producer:false, consumer:true})
  console.log('recive transport params', transportParams);
  consumerTransport = await device.createRecvTransport(transportParams);
  console.log('recive transport', consumerTransport);
  consumerTransport.on('connect', async ({ dtlsParameters }, callback) => {
    console.log('consumr transport connect', dtlsParameters);
    await socketPromise(socket, 'connectTransport', { transportId: consumerTransport.id, dtlsParameters });
    callback();
  });
  // join room
  await socketPromise(socket, 'joinRoom', {
    rtpCapabilities: routerRtpCapabilities,
    device: 'libra'
  });
});
/*创建新的消费者,远端已经创建成功*/
socket.on('newConsumer',async (data, callback) => {
  const videoContainer = document.querySelector('.video-container');
  try {
    const { producerId, id, kind, rtpParameters, type,appData } = data
    console.log(producerId, id, kind, rtpParameters, appData);
    console.log(`recvTransport创建的consume：${kind}`)
    consumer = await consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      type,
    })
    console.log('consumer', consumer);
    const videoTrack = consumer.track;
      console.log('videoTrack', videoTrack);
      const stream = new MediaStream();
      stream.addTrack(videoTrack);
      const video = document.createElement('video');
      console.log(videoContainer);
      videoContainer.appendChild(video)
      video.autoplay = true
      video.muted = true
      video.srcObject = stream;
      callback()
    } catch (error) {
      console.error('newConsumer error', error)
      callback({ error: error.message })
    }
  }
)
socket.on('disconnect', () => {
  console.log(`Disconnected from server with socket id ${socket.id}`);
});
</script>

<style></style>

