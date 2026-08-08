<script setup>
import { onMounted, watch } from 'vue';

const props = defineProps({
  config: { type: Object, required: true },
  scriptSrc: { type: String, default: '/js/header.js' },
  mountId: { type: String, default: 'app-header' },
});

function publishConfig(config, scriptSrc) {
  if (typeof window === 'undefined') {
    return;
  }
  window.headerConfig = config;

  if (!document.querySelector('script[data-header-embed]')) {
    const headerScript = document.createElement('script');
    headerScript.type = 'module';
    headerScript.src = scriptSrc;
    headerScript.dataset.headerEmbed = 'true';
    document.body.appendChild(headerScript);
  }
}

onMounted(() => {
  publishConfig(props.config, props.scriptSrc);
});

watch(
  () => [props.config, props.scriptSrc],
  ([config, scriptSrc]) => {
    publishConfig(config, scriptSrc);
  },
);
</script>

<template>
  <div :id="mountId" data-testid="app-header-mount" />
</template>
