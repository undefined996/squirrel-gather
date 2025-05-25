<template>
  <HoverTooltip :label="label" :status="showTooltip">
    <span ref="actionButtonRef" @click="clickHandle">
      <slot></slot>
    </span>
  </HoverTooltip>
</template>

<script lang="ts" setup>
import { useMouseInElement } from '@vueuse/core'
import { ActionButtonProps } from '~/types/schemas'

const props = withDefaults(defineProps<ActionButtonProps>(), {
  label: '',
  isExpand: true,
  isHiddenTooltip: false
})

const actionButtonRef = ref()
const { isOutside } = useMouseInElement(actionButtonRef)

const showTooltip = computed(
  () => props.isHiddenTooltip && props.isExpand && !isOutside.value
)

const emit = defineEmits(['action'])

const clickHandle = (...args: any[]) => {
  if (args.length) {
    emit('action', ...args)
  } else {
    emit('action')
  }
}
</script>
