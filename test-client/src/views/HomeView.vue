<!--
 * @Author: Libra
 * @Date: 2023-04-30 15:08:56
 * @LastEditTime: 2023-05-02 13:46:59
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div class="card-container">
    <el-card class="card" type="primary" @click="interview">会议模式</el-card>
    <el-card class="card" type="primary" @click="invigilator">监考模式</el-card>
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
.card-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  .card {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 300px;
    height: 200px;
    font-size: 36px;
    font-weight: bold;
    margin: 0 10px;
    &:hover {
      cursor: pointer;
      background-color: #ff9900;
      color: #fff;
    }
  }
}
</style>