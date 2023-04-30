<!--
 * @Author: Libra
 * @Date: 2023-04-30 15:08:56
 * @LastEditTime: 2023-04-30 15:15:32
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div>
    <el-button type="primary" @click="interview">会议模式</el-button>
    <el-button type="primary" @click="invigilator">监考模式</el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter()

function interview() {
  router.push('/login?mode=interview')
}

function invigilator() {
  router.push('/login?mode=invigilator')
}
</script>

<style lang="scss" scoped>

</style>