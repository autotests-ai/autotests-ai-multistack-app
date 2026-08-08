<script setup>
defineProps({
  title: String,
  testId: String,
  titleTestId: String,
  bodyClassName: String,
  hidden: { type: Boolean, default: false },
  className: String,
});
</script>

<template>
  <div class="panel panel--content" :class="className" :data-testid="testId" :hidden="hidden">
    <div class="panel__bar">
      <div class="panel__dots" aria-hidden="true">
        <span class="panel__dot" />
        <span class="panel__dot" />
        <span class="panel__dot" />
      </div>
      <div class="panel__trail">
        <span v-if="title != null && title !== ''" class="panel__title" :data-testid="titleTestId">
          {{ title }}
        </span>
      </div>
    </div>
    <div class="panel__body" :class="bodyClassName">
      <slot />
    </div>
  </div>
</template>
