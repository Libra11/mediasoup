<!--
 * @Author: Libra
 * @Date: 2023-04-30 15:11:02
 * @LastEditTime: 2023-04-30 16:01:56
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div>
    <video ref="videoRef" autoplay muted></video>
    <audio ref="audioRef" autoplay></audio>
    <div class="video-container">
  </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import RoomClient from '../lib/room'

let client
const route = useRoute()
onMounted(async()=>{
  const {roomId, userName} = route.query
  client = new RoomClient({
    roomId,
    userName,
    producer: true,
    consumer: true,
  })
  client.joinRoom('https://localhost:5000', '/libra')
  client.on('connect', async () => {
    await client.produce(true, true, false)
    await client.join()
  })
  client.on('consumer', (consumer) => {
    console.log(consumer);
    handleVideo(consumer)
  })
  client.on('audioProducer', (producer) => {
    console.log('audioProducer', producer)
    handleAudioProducer(producer)
  })
  client.on('videoProducer', (producer) => {
    console.log('videoProducer', producer)
    handleVideoProducer(producer)
  })
  client.on('screenProducer', (producer) => {
    console.log('screenProducer', producer)
    handleVideoProducer(producer)
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
      console.log('dddd')
      suffix = '_a'
      const audioEl = document.querySelector(`#audio${consumer.appData.userId}${suffix}`)
      if (audioEl) {
        const stream = new MediaStream([consumer.track])
        audioEl.srcObject = stream
      } else {
        const stream = new MediaStream([consumer.track])
        const audio = document.createElement('audio')
        audio.id = `audio${consumer.appData.userId}${suffix}`
        audio.controls = true
        audio.autoplay = true
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
      video.width = 640
      video.height = 480
      video.id=`video${consumer.appData.userId}${suffix}`
      videoContainer.appendChild(video)
      video.autoplay = true
      video.muted = true
      video.srcObject = stream;
    }
}

const videoRef = ref(null)
const audioRef = ref(null)
function handleVideoProducer(producer) {
  const videoEl = videoRef.value;
  const stream = new MediaStream;
  stream.addTrack(producer.track);
  videoEl.srcObject = stream;
}
function handleAudioProducer(producer) {
  const audioEl = audioRef.value;
  const stream = new MediaStream;
  stream.addTrack(producer.track);
  audioEl.srcObject = stream;
}
</script>

<style lang="scss" scoped>

</style>