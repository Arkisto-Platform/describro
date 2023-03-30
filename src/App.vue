<script setup>
import {RouterLink, RouterView} from 'vue-router';
import HelloWorld from './components/HelloWorld.vue';
import {reactive} from "vue";

const {detect} = require('detect-browser');
const browser = detect();

const data = reactive({
  noBrowserSupport: false
});

if (browser.name !== 'chrome' && parseFloat(browser.version) < 86) {
  data.noBrowserSupport = true;
}

</script>

<template>
  <header class="flex space-x-2 content-center items-center">
    <!--    <img alt="Describo" class="logo" src="@/assets/logo.svg" width="25" height="25" />-->
    <!--    <span class="">RO-Crate Editor</span>-->
    <el-row :gutter="10" class="flex items-center justify-center min-w-md">
      <el-col :span="8">
        <span class="flex flex-col justify-center items-center">
          <img alt="RO-Crate Editor" class="logo" src="@/assets/logo.svg" width="25" height="25"/>
        </span>
      </el-col>
      <el-col :span="16">
        <div class="flex flex-col justify-center items-center">RO-Crate Editor</div>
      </el-col>
    </el-row>
    <!-- <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/describo">Describo</RouterLink>
    </nav> -->
  </header>
  <RouterView/>
  <el-dialog
      v-model="data.noBrowserSupport"
      title="Browser Not Supported"
      width="50%"
  >
    <span>This Browser is not supported, please use the latest version of <a target="_blank" class="font-bold"
        href="https://www.google.com/chrome/">Google Chrome</a></span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="data.noBrowserSupport = false">Cancel</el-button>
        <el-button type="primary" @click="data.noBrowserSupport = false">
          OK
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

