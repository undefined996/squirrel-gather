<template>
  <HoverTooltip :status="showTooltip" label="双击下载资源">
    <div
      @dblclick="dblclickHandle"
      ref="downloadButtonRef"
      class="cursor-pointer h-[18px] p-y-[8px] p-x-[2px] rounded-tl-full rounded-bl-full box-shadow flex flex-row justify-start items-center"
      :class="[
        isExpand ? 'w-[48px] opacity-100' : 'w-[36px] opacity-[.68]',
        statusStyle
      ]"
    >
      <LoadingIcon
        v-if="taskStatus === StatusType.PROCESSING"
        class="text-white text-[18px] pl-2.5 p-y-1"
      ></LoadingIcon>
      <div v-else class="flex items-center">
        <eva-cloud-download-outline
          class="text-white text-[18px] pl-2.5 p-y-1 relative"
        />
        <Transition name="fade">
          <weui-done2-filled
            class="absolute bottom-[3px] text-[#07C160] text-[9px] font-bold"
            :class="[isExpand ? 'left-[50%]' : 'left-[66%]']"
            v-if="taskStatus === StatusType.FINISHED"
          ></weui-done2-filled>
        </Transition>
        <Transition name="fade"
          ><lets-icons-close-round-fill
            class="absolute bottom-[3px] text-[#FA5151] text-[9px] font-bold"
            :class="[isExpand ? 'left-[50%]' : 'left-[66%]']"
            v-if="taskStatus === StatusType.FAILED"
          ></lets-icons-close-round-fill
        ></Transition>
      </div>
    </div>
  </HoverTooltip>
</template>

<script setup lang="ts">
import { useMouseInElement } from '@vueuse/core'
import { StatusType } from '~/types/schemas'

type withSubmitActionButtonProps = {
  label?: string
  isExpand: boolean
  isHiddenTooltip: boolean
  taskStatus: StatusType
}

const props = withDefaults(defineProps<withSubmitActionButtonProps>(), {
  isExpand: true,
  isHiddenTooltip: false,
  taskStatus: StatusType.INIT
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

const statusStyle = computed(() => {
  return props.taskStatus === StatusType.PROCESSING
    ? 'bg-gray cursor-not-allowed pointer-events-none'
    : 'bg-gradient-to-r from-brand to-brand-secondary'
})
</script>
