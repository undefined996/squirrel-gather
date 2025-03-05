<script setup lang="ts">
import 'uno.css'
import { useMouseInElement } from '@vueuse/core'
import { useDrag } from '~/composables/useDrag'
import { useSwitchGroups } from '~/composables/useSwitchGroups'
import { useToast } from '~/composables/useToast'
import useDownloadController from '~/composables/useDownloadController'
import { useStaticClickOutside as useClickOutside } from '~/composables/useClickOutside'
import { Settings } from '~/types'

// 下载任务提交状态
const isSubmit = ref(false)
// 是否关闭悬浮按钮（包含设置面板）
const isClose = ref(false)
// 是否展示设置面板
const isShowSettingsCard = ref(false)
// 悬浮按钮
const floatingButtonRef = ref()
// 设置面板
const settingsCardRef = ref()
// 设置按钮
const settingsButtonRef = ref()
// 关闭按钮
const closeButtonRef = ref()

// 创建Settings接口对象，并设置默认值
const settings: Settings = {
  isReadMe: ref(true),
  isMainVideo: ref(true),
  isMainImages: ref(true),
  isSkus: ref(true),
  isDetailImages: ref(true),
  isDetailVideo: ref(false)
}

const defaultToastStyle = 'min-h-[36px] min-width-[60px] px-[24px] py-[18px]'

// 设置面板具体的配置项
const { switchGroups } = useSwitchGroups(settings)
// toast hook
const { showToastWithDelay: showToast } = useToast(defaultToastStyle)

// 关闭悬浮按钮Handle
const closeHandle = (event: MouseEvent) => {
  if (!isShowSettingsCard.value) {
    isClose.value = true
  } else {
    isShowSettingsCard.value = false
  }
  event.stopPropagation()
}

// useMouseInElement监听鼠标是否移出元素外部
const { isOutside } = useMouseInElement(floatingButtonRef)
// 是否展开
const isExpand = computed(() => isShowSettingsCard.value || !isOutside.value)

// // 优化展开
// const isExpand = ref(false)

// // 监听 isShowSettingsCard 和 isOutside 的变化
// watchEffect(() => {
//   isExpand.value = isShowSettingsCard.value || !isOutside.value
// })

// 监听设置面板外部任何区域时关闭设置面板，设置按钮本身除外
// onClickOutside(
//   settingsCardRef,
//   async (event) => {
//     if (isShowSettingsCard.value) {
//       await settingsShowHandle(event)
//     }
//   },
//   { ignore: [settingsButtonRef, closeButtonRef] }
// )

// 设置按钮点击处理函数
const settingsShowHandle = (event: MouseEvent) => {
  isShowSettingsCard.value = !isShowSettingsCard.value
  event.stopPropagation()
}

// 可拖拽功能调用
const { y, adaptiveStyles } = useDrag(floatingButtonRef)

// 提交下载任务等待background反馈结果并触发Toast
const { downloadHandle } = useDownloadController(isSubmit, settings, showToast)

// 监听从后端传递的异常消息并触发Toast
// onMessage('downloadResourcesFailed', ({}) => {
//   showToast(NotificationMessage.ERROR, 'error', {
//     duration: 15000,
//     closeButton: true
//   })
// })

// 监听设置面板外部任何区域时关闭设置面板，设置按钮、关闭按钮除外
// onClickOutside(
//   settingsCardRef,
//   async (event) => {
//     if (isShowSettingsCard.value) {
//       await settingsShowHandle(event)
//     }
//   },
//   { ignore: [settingsButtonRef, closeButtonRef] }
// )

useClickOutside(
  settingsCardRef,
  () => {
    if (isShowSettingsCard.value) {
      isShowSettingsCard.value = false
    }
  },
  isShowSettingsCard,
  [settingsButtonRef, closeButtonRef]
)
</script>

<template>
  <div
    ref="floatingButtonRef"
    class="z-99999 max-h-[100px] fixed right-0"
    v-if="!isClose"
    :style="{ top: `${y}px` }"
  >
    <!-- 设置弹出面板 -->
    <div
      ref="settingsCardRef"
      class="bg-white box-shadow px-[24px] py-[20px] flex flex-col gap-y-4 rounded-[10px] w-max h-max max-h-[270px] absolute right-[68px]"
      :style="adaptiveStyles"
      :class="[isShowSettingsCard ? 'visible' : 'invisible']"
    >
      <div v-for="(item, idx) in switchGroups" :key="idx">
        <span class="block font-bold mb-2.5" text="[14px] gray-500">{{
          item.name
        }}</span>
        <div class="grid grid-cols-1 gap-y-1.5">
          <SwitchWithLabel
            :label="detailItem.name"
            v-model="detailItem.status.value"
            v-for="detailItem in item.children"
          />
        </div>
      </div>
    </div>

    <!-- 按钮面板 -->
    <div class="flex flex-col items-end gap-y-2">
      <!-- 关闭按钮 -->
      <CloseButton
        ref="closeButtonRef"
        :is-expand="isExpand"
        :is-hidden-tooltip="!isShowSettingsCard"
        @update:close-action="closeHandle"
        label="关闭悬浮按钮"
      />

      <!-- 下载按钮 -->
      <DownloadButton
        :is-expand="isExpand"
        :is-hidden-tooltip="!isShowSettingsCard"
        :is-submit="isSubmit"
        @update:download-submit="downloadHandle"
      />

      <!-- 设置按钮 -->
      <SettingsButton
        :is-expand="isExpand"
        :is-hidden-tooltip="!isShowSettingsCard"
        label="点击设置"
        @update:show-settings-card="settingsShowHandle"
        ref="settingsButtonRef"
        class="relative"
      />
    </div>
  </div>
</template>
