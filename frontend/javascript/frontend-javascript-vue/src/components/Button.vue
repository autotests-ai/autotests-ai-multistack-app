<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  block: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  id: String,
});

const variantClass = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
};
</script>

<template>
  <button
    :id="id"
    :type="type"
    class="btn"
    :class="[variantClass[variant], block && 'btn--block']"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
