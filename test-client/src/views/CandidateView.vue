<!--
 * @Author: Libra
 * @Date: 2023-04-29 21:25:07
 * @LastEditTime: 2023-04-29 21:47:26
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
  const client = new RoomClient('123', 'libra', true, false, true, false, true)
  client.joinRoom('https://localhost:5000', '/libra')
})
</script>

<style lang="scss" scoped>

</style>