<!--
 * @Author: Libra
 * @Date: 2023-04-29 21:25:56
 * @LastEditTime: 2023-05-04 11:50:27
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div class="video-container">
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import RoomClient from '../lib/room'

const route = useRoute()
onMounted(async()=>{
  const {roomId, userName} = route.query
  const client = new RoomClient({
    roomId,
    userName,
    producer: false,
    consumer: true,
  })
  // await client.joinRoom('https://localhost:5000', '/libra')
  client.joinRoom('https://104.225.148.105:5000', '/libra')
  client.on('connect', () => {
    client.join()
  })
  client.on('consumer', (consumer) => {
    console.log(consumer);
    handleVideo(consumer)
  })
})

function handleVideo(consumer) {
  const videoContainer = document.querySelector('.video-container')
    console.log('consumer data', consumer.appData)
    let suffix = '_c'
    if (consumer.appData.share) {
      suffix = '_s'
    }
    if (consumer.appData.audio) {
      suffix = '_a'
      const audioEl = document.querySelector(`#audio${consumer.appData.userId}${suffix}`)
      if (audioEl) {
        const stream = new MediaStream([consumer.track])
        audioEl.srcObject = stream
        audioEl.autoplay = true
        audioEl.muted = false
      } else {
        const stream = new MediaStream([consumer.track])
        const audio = document.createElement('audio')
        audio.id = `audio${consumer.appData.userId}${suffix}`
        audio.autoplay = true
        audio.muted = false
        audio.srcObject = stream
        videoContainer.appendChild(audio)
      }
      return
    }
    const videoEle = document.querySelector(`#video${consumer.appData.userId}${suffix}`)
    if (videoEle) {
      const videoTrack = consumer.track;
      const stream = new MediaStream()
      stream.addTrack(videoTrack);
      videoEle.srcObject = stream;
    } else {
      const videoTrack = consumer.track;
      const stream = new MediaStream();
      stream.addTrack(videoTrack);
      const video = document.createElement('video');
      video.width = 320
      video.height = 240
      video.id=`video${consumer.appData.userId}${suffix}`
      videoContainer.appendChild(video)
      video.autoplay = true
      video.muted = true
      video.srcObject = stream;
    }
}

</script>

<style lang="scss" scoped>

</style>