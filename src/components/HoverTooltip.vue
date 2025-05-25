<template>
  <div class="relative w-max">
    <span v-show="status" :class="tooltipClass">
      {{ label }}
    </span>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface HoverTooltipProps {
  label: string
  status: boolean
}

withDefaults(defineProps<HoverTooltipProps>(), {
  label: '双击下载资源',
  status: true
})

const tooltipClass = computed(() => {
  return [
    'absolute',
    'right-full',
    '-translate-x-1/4',
    'top-1/2',
    'transform',
    '-translate-y-1/2',
    'transition-all',
    'duration-300',
    'ease-in-out',
    'bg-gray-500',
    'px-4',
    'py-1',
    'rounded-full',
    'text-white',
    'text-xs',
    'whitespace-nowrap',
    'delay-200'
  ]
})
</script>
