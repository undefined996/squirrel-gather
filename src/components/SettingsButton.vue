<template>
  <ActionButton
    :label="label"
    :is-expand="isExpand"
    :is-hidden-tooltip="isHiddenTooltip"
    @action="clickHandle"
  >
    <uil-setting
      class="text-gray-300 text-[16px] cursor-pointer p-[4px] bg-white rounded-full flex-row-center box-shadow mr-2"
      :class="[isExpand ? 'visible' : 'invisible']"
    />
  </ActionButton>
</template>

<script lang="ts" setup>
import { ActionButtonProps } from '~/types'

withDefaults(defineProps<ActionButtonProps>(), {
  label: '',
  isExpand: true,
  isHiddenTooltip: false
})

const emit = defineEmits(['update:showSettingsCard'])

const clickHandle = (event: MouseEvent) => {
  emit('update:showSettingsCard', event)
}
</script>
