<script setup>
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  label: { type: String, required: true },
  id: String,
  name: String,
  type: { type: String, default: 'text' },
  autocomplete: String,
  modelValue: { type: String, default: '' },
  labelVariant: { type: String, default: 'caption' },
  divided: { type: Boolean, default: true },
  stretch: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue']);

const attrs = useAttrs();

/** Autofill / DevTools: every form control needs id or name. */
const controlId = computed(() => props.id);
const controlName = computed(() => props.name ?? props.id);

const labelClass = (variant) =>
  variant === 'param' ? 'plaque-field__label' : 'plaque-field__text';
</script>

<template>
  <label
    class="plaque-field"
    :class="{
      'plaque-field--divided': divided,
      'plaque-field--stretch': stretch,
    }"
  >
    <span
      :class="labelClass(labelVariant)"
      :title="labelVariant === 'param' ? label : undefined"
    >
      {{ label }}
    </span>
    <span v-if="divided" class="plaque-divider" aria-hidden="true" />
    <input
      :id="controlId"
      :name="controlName"
      class="input plaque-field__control"
      :type="type"
      :autocomplete="autocomplete"
      :value="modelValue"
      v-bind="attrs"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>
