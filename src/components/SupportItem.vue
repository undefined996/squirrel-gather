<template>
  <div class="flex-row-between gap-x-[48px] text-[12px]">
    <span class="text-gray-300">{{ name }}</span>
    <teenyicons-shield-tick-solid
      class="text-[16px] p-[2px]"
      :class="[status ? 'text-brand' : 'text-gray']"
    />
  </div>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    default: '未知站点'
  },
  status: {
    type: Boolean,
    default: false
  }
})
</script>
