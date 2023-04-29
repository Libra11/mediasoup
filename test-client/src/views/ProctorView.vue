<!--
 * @Author: Libra
 * @Date: 2023-04-29 21:25:56
 * @LastEditTime: 2023-04-29 22:52:42
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div class="video-container">
kkk
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import RoomClient from '../lib/room'

let client;
onMounted(async()=>{
  client = new RoomClient('123', 'libra1', false, true, false, false, false)
  await client.joinRoom('https://localhost:5000', '/libra')
  console.log(client);
  // const emitter = client
  client.on('consumers', (consumers) => {
    console.log(consumers);
    // handle video
    handleVideo(consumers)
  })
})

function handleVideo(consumers) {
  const videoContainer = document.querySelector('.video-container')
  var child = videoContainer.lastElementChild;
  while (child) {
    videoContainer.removeChild(child);
    child = videoContainer.lastElementChild;
  }
  for (const consumer of Array.from(consumers.values())) {
    console.log(consumer)
    const videoTrack = consumer.track;
    console.log('videoTrack', videoTrack);
    const stream = new MediaStream();
    stream.addTrack(videoTrack);
    const video = document.createElement('video');
    video.id=`video${consumer.appData.roomId}`
    videoContainer.appendChild(video)
    video.autoplay = true
    video.muted = true
    video.srcObject = stream;
  }
}

</script>

<style lang="scss" scoped>

</style>