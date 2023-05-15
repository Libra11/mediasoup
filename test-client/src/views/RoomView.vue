<!--
 * @Author: Libra
 * @Date: 2023-04-30 15:11:02
 * @LastEditTime: 2023-05-04 13:20:44
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div class="room-container">
    <div class="video-container">
      <el-card class="my-container">
        <div class="name">本人</div>
        <div class="icon-video">
          <el-icon @click="muteMic" v-show="!isMute"><Microphone /></el-icon>
          <el-icon @click="unmuteMic" v-show="isMute"><Mute /></el-icon>
          <el-icon @click="banVideo"><VideoCamera /></el-icon>
          <el-icon @click="switchScreenCamera"><Platform /></el-icon>
        </div>
        <video class="my-video" width="320" height="240" ref="videoRef" autoplay muted></video>
      </el-card>
      <audio ref="audioRef" autoplay></audio>
    </div>
    <el-card class="message-container">
      <div class="message-list">
        <span class="message-item" :class="`${item.from === userName?'':'is-me'}`" v-for="item in messageList" :key="item.id">
          <div class="message-name">用户：{{item.from}}</div>
          <div class="message-content">{{item.message}}</div>
        </span>
      </div>
      <div class="send">
        <el-input v-model="message" placeholder="请输入内容" />
        <el-button type="primary" @click="sendMessage" :icon="Promotion" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { Microphone, Mute, VideoCamera, Platform, Promotion  } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router';
import RoomClient from '../lib/room'

let client
const route = useRoute()
let isMute = ref(false)
let isVideoMute = ref(false)
let isScreenShare = ref(false)
const {roomId, userName} = route.query
const messageList = ref([])
onMounted(async()=>{
  client = new RoomClient({
    roomId,
    userName,
    producer: true,
    consumer: true,
  })
  client.joinRoom('https://localhost:5000', '/libra')
  // client.joinRoom('https://104.225.148.105:5000', '/libra')
  client.on('connect', async () => {
    await client.produceVideoAndAudio()
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

  client.on('message', (message) => { 
    messageList.value.push(message)
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

const videoRef = ref(null)
const audioRef = ref(null)
function handleVideoProducer(producer) {
  const videoEl = videoRef.value;
  const stream = new MediaStream;
  stream.addTrack(producer.track);
  videoEl.srcObject = stream;
}
function handleAudioProducer(producer) {
  if (producer.appData.userId === `${roomId}-${userName}`) {
    return
  }
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

// function FullScreen() {
//     var doc = document.documentElement;
//     if (doc.requestFullscreen) {
//         ele.requestFullscreen();
//     }
// }

// function exitFullscreen() {
//   var doc = document;
//   if (doc.exitFullscreen) {
//       doc.exitFullscreen();
//   }
// }

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

const message = ref('')
async function sendMessage() {
  if (message.value) {
    const msg = {
      message: message.value,
      type: 0,
      from: userName
    }
    message.value = ''
    messageList.value.push(msg)
    await client.sendMessage(msg)
  }
}
</script>

<style>
video {
  background: #000;
}
</style>
<style lang="scss" scoped>
:deep(.el-icon) {
  color: #fff;
  cursor: pointer;
  margin: 0 5px;
}
.room-container {
  display: flex;
  // justify-content: center;
  align-items: center;
}
.my-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  width: 320px;
  height: 240px;
  .icon-video {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 1;
  }
  .name {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 1;
    color: #3ce729;
  }
}

.video-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
}
.message-container {
  width: 300px;
  height: 500px;
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  justify-content: space-between;
  // align-items: center;
  flex-direction: column;
  .message-list {
    flex: 1;
    height: 400px;
    overflow: auto;
    text-align: right;
    .message-item {
      display: flex;
      padding: 0 10px;
      border-radius: 4px;
      word-break: break-all;
      margin: 0 0 10px 10px;
      flex-direction: column;
      color: #ff9900;
      .message-name {
        font-size: 12px;
      }
    }
    .is-me {
      color: #000;
    }
  }
  .send {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>