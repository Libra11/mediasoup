<!--
 * @Author: Libra
 * @Date: 2023-04-30 15:09:44
 * @LastEditTime: 2023-05-02 13:53:38
 * @LastEditors: Libra
 * @Description: 
-->
<template>
  <div class="login-container">
    <el-card class="login">
      <div class="title">进入房间</div>
    <el-form  :model="form" class="demo-form-inline">
    <el-form-item>
      <el-input size="large" v-model="form.roomId" placeholder="房间号" />
    </el-form-item>
    <el-form-item>
      <el-input size="large" v-model="form.userName" placeholder="用户名" />
    </el-form-item>
    <el-form-item v-if="mode==='invigilator'">
      <el-radio-group v-model="form.userRole">
        <el-radio :label="1">考生</el-radio>
        <el-radio :label="2">监考官</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-button size="large" type="primary" @click="login">登录</el-button>
    </el-form-item>
  </el-form>
  </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const form = reactive({
  roomId: '',
  userName: '',
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

<style lang="scss" scoped>
:deep(.el-card__body) {
  width: 300px;
}
:deep(.el-form) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .el-form-item {
    width: 100%;
    .el-button {
      width: 100%;
    }
  }
}
  .login-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    .login {
      width: 300px;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      .title {
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 20px;
      }
    }
  }
</style>


