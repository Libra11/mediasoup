<!--
 * @Author: Libra
 * @Date: 2023-04-29 21:25:07
 * @LastEditTime: 2023-04-30 10:36:45
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div>
ddd
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import RoomClient from '../lib/room'

onMounted(async()=>{
  const client = new RoomClient({
    roomId: '123',
    userName: 'libra',
    producer: true,
    consumer: false,
    video: true,
    audio: true,
    screen: true,
  })
  client.joinRoom('https://localhost:5000', '/libra')
  const client2 = new RoomClient({
    roomId: '123',
    userName: 'libra3',
    producer: true,
    consumer: false,
    video: true,
    audio: false,
    screen: false,
  })
  client2.joinRoom('https://localhost:5000', '/libra')
})
</script>

<style lang="scss" scoped>

</style>