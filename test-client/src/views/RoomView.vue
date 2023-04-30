<!--
 * @Author: Libra
 * @Date: 2023-04-30 15:11:02
 * @LastEditTime: 2023-04-30 19:14:44
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div>
    <div class="my-container">
      <div class="name">本人</div>
      <div class="icon-video">
        <el-icon @click="muteMic" v-show="!isMute"><Microphone /></el-icon>
        <el-icon @click="unmuteMic" v-show="isMute"><Mute /></el-icon>
        <el-icon @click="banVideo"><VideoCamera /></el-icon>
        <el-icon @click="switchScreenCamera"><Platform /></el-icon>
      </div>
      <video class="my-video" width="320" height="240" ref="videoRef" autoplay muted></video>
    </div>
    <audio ref="audioRef" autoplay></audio>
    <div class="video-container">
  </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { Microphone, Mute, VideoCamera, Platform } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router';
import RoomClient from '../lib/room'

let client
const route = useRoute()
let isMute = ref(false)
let isVideoMute = ref(false)
let isScreenShare = ref(false)
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
    await client.produceVideoAndAudio({audio: true})
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

onBeforeUnmount(() => {
  client.close()
})

function handleVideo(consumer) {
  const videoContainer = document.querySelector('.video-container')
    console.log('consumer data', consumer.appData)
    let suffix = '_c'
    if (consumer.appData.audio) {
      suffix = '_a'
      const audioEl = document.querySelector(`#audio${consumer.appData.userId}${suffix}`)
      if (audioEl) {
        const stream = new MediaStream([consumer.track])
        audioEl.srcObject = stream
      } else {
        const stream = new MediaStream([consumer.track])
        const audio = document.createElement('audio')
        audio.id = `audio${consumer.appData.userId}${suffix}`
        audio.autoplay = true
        audio.muted = true
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

function muteMic() {
  isMute.value = !isMute.value
  client.muteMic()
}
function unmuteMic() {
  isMute.value = !isMute.value
  client.unmuteMic()
}

function banVideo() {
  console.log(isVideoMute.value)
  if (isVideoMute.value) {
    client.unmuteVideo()
    isVideoMute.value = false
  } else {
    client.muteVideo()
    isVideoMute.value = true
  }
}

async function switchScreenCamera() {
  if (isScreenShare.value) {
    await client.closeScreen()
    await client.produceVideoAndAudio({audio: true})
    isScreenShare.value = false
  } else {
    await client.produceScreen()
    await client.closeWebcam()
    isScreenShare.value = true
  }
}
</script>

<style lang="scss" scoped>
:deep(.el-icon) {
  color: #fff;
  cursor: pointer;
  margin: 0 5px;
}
.my-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  .icon-video {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1;
  }
  .name {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1;
    color: #3ce729;
  }
}

.video-container {
  display: flex;
  flex-wrap: wrap;
  height: 100vh;
  width: 100vw;
}
</style>