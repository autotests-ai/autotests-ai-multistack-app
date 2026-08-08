<script setup>
import AppHeader from './components/AppHeader.vue';
import { appPath } from './lib/appBase';
import { headerConfig } from './lib/headerConfig';
</script>

<template>
  <AppHeader :config="headerConfig" :script-src="appPath('/js/header.js')" />
  <RouterView />
</template>
