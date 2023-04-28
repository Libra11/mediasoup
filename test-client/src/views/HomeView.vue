<!--
 * @Author: Libra
 * @Date: 2023-04-26 18:50:03
 * @LastEditTime: 2023-04-28 15:47:04
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div>
    <video ref="videoRef" width="640" height="480" autoplay muted="false"></video>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { io } from 'socket.io-client';
import * as mediaSoupClient from 'mediasoup-client'

const videoRef = ref(null);
const socket = io('https://localhost:5000', {
  path: '/libra',
  query: {
    roomId: '123',
    userName: `Libra`
  },
});
let producerTransport;
let producer;
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
  // routerRtpCapabilities 是一个描述 mediasoup 路由器所支持的 RTP 功能（编解码器、扩展和其他相关功能）的对象。
  // 当你创建一个 mediasoup 路由器时，该对象会自动生成。
  const routerRtpCapabilities = await socketPromise(socket, 'getRouterRtpCapabilities');
  console.log('routerRtpCapabilities', routerRtpCapabilities);
  // Device 是一个客户端库（mediasoup-client）的核心概念。它表示一个 WebRTC 客户端设备（如浏览器），
  // 用于处理 mediasoup 服务器与客户端之间的媒体流协商、传输和播放。Device 对象用于简化 mediasoup 客户端开发，
  // 它将底层 WebRTC API（如 RTCPeerConnection、RTPSender 和 RTPReceiver）封装在更高层的 API 中。
  const device = new mediaSoupClient.Device();
  await device.load({ routerRtpCapabilities: routerRtpCapabilities });
  console.log('device', device);

  const transportParams = await socketPromise(socket, 'createWebRtcTransport', {producer:true, consumer:false})
  console.log('send transport params', transportParams);
  /**
   * 客户端 transport（mediasoup-client）：
     客户端的 transport 是基于浏览器或应用的 WebRTC 实现，负责与 mediasoup 服务器端的 transport 进行通信。客户端 transport 使用 WebRTC API（如 RTCPeerConnection、RTCDataChannel 等）来建立连接、发送和接收媒体流。
     在 mediasoup-client 中，客户端 transport 主要包括两种类型：SendTransport 和 RecvTransport。SendTransport 用于产生（发送）媒体流到 mediasoup 服务器，而 RecvTransport 用于从服务器消费（接收）媒体流。你需要使用从服务器获取的 transport 参数（如 id、iceParameters、iceCandidates、dtlsParameters 等）创建客户端 transport 实例。
   */
  producerTransport = await device.createSendTransport(transportParams);
  console.log('send transport', producerTransport);
  producerTransport.on('connect', async ({ dtlsParameters }, callback) => {
    /**
     * dtlsParameters 是在 WebRTC 连接过程中，用于传递 DTLS 相关信息的一个对象。它包含了 DTLS 连接所需的关键参数，如指纹（fingerprint）和角色（role）。指纹是 DTLS 证书的哈希值，用于确保证书的完整性和真实性。角色定义了在 DTLS 握手过程中的主动（client）和被动（server）方。

      在 mediasoup 中，dtlsParameters 用于在客户端（如浏览器）和 mediasoup 服务器之间建立安全的 WebRTC 连接。当你创建一个服务端 transport（例如，WebRtcTransport）时，mediasoup 将生成相应的 dtlsParameters。你需要将这些参数传递给客户端，以便客户端在创建 SendTransport 和 RecvTransport 时使用这些参数建立与 mediasoup 服务器的 DTLS 连接。
     */
    console.log('connect', dtlsParameters);
    await socketPromise(socket, 'connectTransport', { transportId: producerTransport.id, dtlsParameters });
    callback();
  });

  producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
    console.log('kind', kind);
    console.log('rtpParameters', rtpParameters);
    try {
      const id = await socketPromise(socket, 'produce', { transportId: producerTransport.id, kind, rtpParameters });
      console.log('id', id, kind)
      callback(id);
    } catch (error) {
      errback(error);
    }
  });

  const localStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  const videoTrack = localStream.getVideoTracks()[0];
  // const audioTrack = localStream.getAudioTracks()[0];
  /**
   * 在 mediasoup-client 中，客户端 transport 的 produce 方法用于将本地媒体流（音频或视频）发送到 mediasoup 服务器。
   * 当你想要在客户端产生并向其他客户端分享媒体流时，你需要使用 produce 方法。
   */
  producer = await producerTransport.produce({ track:videoTrack });
  const videoEl = videoRef.value;
  const stream = new MediaStream;
  stream.addTrack(producer.track);
  videoEl.srcObject = stream;
});

socket.on('disconnect', () => {
  console.log(`Disconnected from server with socket id ${socket.id}`);
});
</script>

<style></style>

