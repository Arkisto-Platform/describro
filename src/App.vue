<script setup>
import { RouterLink, RouterView } from 'vue-router';
import HelloWorld from './components/HelloWorld.vue';
</script>

<template>
  <header class="flex space-x-2 content-center items-center">
    <img alt="Describo" class="logo" src="@/assets/logo.svg" width="25" height="25" />
    <span class="">RO-Crate Editor</span>
    <!-- <el-row :gutter="10" class="flex items-center justify-center min-w-md">
      <el-col :span="8">
        <span class="flex flex-col justify-center items-center">
          <img alt="Describo" class="logo" src="@/assets/logo.svg" width="25" height="25" />
        </span>
      </el-col>
      <el-col :span="16">
        <div class="flex flex-col justify-center items-center">Describo</div>
      </el-col>
    </el-row> -->
    <!-- <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/describo">Describo</RouterLink>
    </nav> -->
  </header>

  <RouterView />
</template>

