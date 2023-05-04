<!--
 * @Author: Libra
 * @Date: 2023-04-29 21:25:07
 * @LastEditTime: 2023-05-04 11:50:33
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div class="candidate-container">
    <div class="header">
      <el-button type="primary" size="large" @click="screenShare">屏幕分享</el-button>
    </div>
    <div class="content">
      <div class="left">答题区域</div>
      <div class="right">
        <video ref="videoRef" id="candidate" autoplay></video>
        <audio ref="audioRef" id="audio"></audio>
      </div>
    </div>
    <div class="footer">Footer</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import RoomClient from '../lib/room'

let client
const route = useRoute()
const {roomId, userName} = route.query
onMounted(async()=>{
  client = new RoomClient({
    roomId,
    userName,
    producer: true,
    consumer: false,
  })
  // client.joinRoom('https://localhost:5000', '/libra')
  client.joinRoom('https://104.225.148.105:5000', '/libra')
  client.on('connect', async () => {
    await client.produceVideoAndAudio({audio:true})
    client.join()
  })
  client.on('audioProducer', (producer) => {
    console.log('audioProducer', producer)
    handleAudioProducer(producer)
  })
  client.on('videoProducer', (producer) => {
    console.log('videoProducer', producer)
    handleVideoProducer(producer)
  })
})

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

function screenShare() {
  client.produceScreen()
}
</script>

<style lang="scss" scoped>
.candidate-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  .header {
    padding: 0 20px;
    display: flex;
justify-content: flex-end;
align-items: center;
    width: 100%;
    height: 80px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #ccc;
  }
  .content {
    flex: 1;
    display: flex;
justify-content: center;
align-items: center;
    width: 100%;
    .left {
      flex: 1;
      height: 100%;
      background-color: #f0f0f0;
      border-right: 1px solid #ccc;
    }
    .right {
      width: 300px;
      height: 100%;
      background-color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      video {
        margin-top: 20px;
        width: 280px;
        height: 320px;
        background-color: #000;
        object-fit: cover;
      }
    }
  }

  .footer {
    width: 100%;
    height: 40px;
    background-color: #f0f0f0;
    border-top: 1px solid #ccc;
  }
}
</style>