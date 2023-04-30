<!--
 * @Author: Libra
 * @Date: 2023-04-30 15:09:44
 * @LastEditTime: 2023-04-30 19:08:15
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <el-form  :model="form" class="demo-form-inline">
    <el-form-item label="RoomId">
      <el-input v-model="form.roomId" placeholder="RoomId" />
    </el-form-item>
    <el-form-item label="用户名">
      <el-input v-model="form.userName" placeholder="用户名" />
    </el-form-item>
    <el-form-item v-if="mode==='invigilator'">
      <el-radio-group v-model="form.userRole">
        <el-radio :label="1">考生</el-radio>
        <el-radio :label="2">监考官</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="login">登录</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const form = reactive({
  roomId: '123',
  userName: 'libra',
  userRole: '',
})


const route = useRoute();
const router = useRouter();
const mode = ref(route.query.mode);

const login = () => {
  if (mode.value === 'interview') {
    router.push(`/room?roomId=${form.roomId}&userName=${form.userName}`)
  } else if (mode.value === 'invigilator') {
    if (form.userRole === 1) {
      router.push(`/candidate?roomId=${form.roomId}&userName=${form.userName}`)
    } else if (form.userRole === 2) {
      router.push(`/proctor?roomId=${form.roomId}&userName=${form.userName}`)
    }
  }
}
</script>


