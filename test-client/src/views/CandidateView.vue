<!--
 * @Author: Libra
 * @Date: 2023-04-29 21:25:07
 * @LastEditTime: 2023-05-02 11:17:09
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div>
    <button @click="shareCamera">分享摄像头</button>
    <button @click="shareScreen">分享屏幕</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
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
    consumer: false,
  })
  // client.joinRoom('https://localhost:5000', '/libra')
  client.joinRoom('https://104.225.148.105:5000', '/libra')
})

async function shareCamera() {
  await client.produce(true, true, false)
}

async function shareScreen() {
  await client.produce(false, false, true)
}
</script>

<style lang="scss" scoped>

</style>