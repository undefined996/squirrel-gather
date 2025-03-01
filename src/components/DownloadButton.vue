<template>
  <HoverTooltip :status="showTooltip" label="双击下载资源">
    <div
      @dblclick="dblclickHandle"
      ref="downloadButtonRef"
      class="cursor-pointer h-[18px] p-y-[8px] p-x-[2px] rounded-tl-full rounded-bl-full box-shadow flex flex-row justify-start items-center flex-row-start-center"
      :class="[
        isExpand ? 'w-[48px] opacity-100' : 'w-[36px] opacity-[.68]',
        isSubmit
          ? 'bg-gray cursor-not-allowed pointer-events-none'
          : 'bg-gradient-to-r from-brand to-brand-secondary'
      ]"
    >
      <LoadingIcon
        v-if="isSubmit"
        class="text-white text-[18px] pl-2.5 p-y-1"
      ></LoadingIcon>
      <eva-cloud-download-outline
        v-else
        class="text-white text-[18px] pl-2.5 p-y-1 relative"
      />
    </div>
  </HoverTooltip>
</template>

<script setup lang="ts">
import { useMouseInElement } from '@vueuse/core'

type withSubmitActionButtonProps = {
  label?: string
  isExpand: boolean
  isHiddenTooltip: boolean
  isSubmit: boolean
}

const props = withDefaults(defineProps<withSubmitActionButtonProps>(), {
  isExpand: true,
  isHiddenTooltip: false,
  isSubmit: false
})

const downloadButtonRef = ref()
const { isOutside } = useMouseInElement(downloadButtonRef)

const showTooltip = computed(
  () => props.isHiddenTooltip && props.isExpand && !isOutside.value
)

const emit = defineEmits(['update:downloadSubmit'])

const dblclickHandle = () => {
  emit('update:downloadSubmit')
}
</script>
