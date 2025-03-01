<template>
  <ActionButton
    :label="label"
    :is-expand="isExpand"
    :is-hidden-tooltip="isHiddenTooltip"
    @action="clickHandle"
  >
    <material-symbols-close-rounded
      :class="[isExpand ? 'visible' : 'invisible']"
      class="text-white text-[12px] bg-gray-200 rounded-full box-shadow mr-1 p-[1px]"
    />
  </ActionButton>
</template>

<script setup lang="ts">
import { ActionButtonProps } from '~/types'

withDefaults(defineProps<ActionButtonProps>(), {
  label: '',
  isExpand: true,
  isHiddenTooltip: false
})

const emit = defineEmits(['update:closeAction'])

const clickHandle = (event: MouseEvent) => {
  event.stopPropagation()
  emit('update:closeAction')
}
</script>
