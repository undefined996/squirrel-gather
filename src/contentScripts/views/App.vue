<script setup lang="ts">
import 'uno.css'
import { useMouseInElement } from '@vueuse/core'
import { useDrag } from '~/composables/useDrag'
import { useSwitchGroups } from '~/composables/useSwitchGroups'
import { useToast } from '~/composables/useToast'
import useDownloadController from '~/composables/useDownloadController'
import { useStaticClickOutside as useClickOutside } from '~/composables/useClickOutside'
import { Settings, StatusType } from '~/types/schemas'
import { sendMessage } from 'webext-bridge/content-script'
import { getPageUrl, plainSettings } from '~/utils/common'
import { NotificationMessage } from '~/constants'
import browser from 'webextension-polyfill'
import {
  NativeMessageMap,
  NativeMessageType
} from '~/types/native-message-protocol'

import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import type { ModeType } from '~/types/schemas'

// 任务状态
const taskStatus = ref<StatusType>(StatusType.INIT)
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
const { isOutside, stop: stopMouseTracker } =
  useMouseInElement(floatingButtonRef)
// 是否展开
const isExpand = computed(() => isShowSettingsCard.value || !isOutside.value)

// 设置按钮点击处理函数
const settingsShowHandle = (event: MouseEvent) => {
  isShowSettingsCard.value = !isShowSettingsCard.value
  event.stopPropagation()
}

// 可拖拽功能调用
const { y, adaptiveStyles } = useDrag(floatingButtonRef)
// 获取用户选择的模式
const extractionMode = useWebExtensionStorage<ModeType>(
  'extraction-mode',
  'hidden'
)

const downloadHandle = async () => {
  taskStatus.value = StatusType.PROCESSING
  await showToast(NotificationMessage.STARTING)

  if (extractionMode.value === 'hidden') {
    console.log('用户当前选择的是hidden模式')
    const data = {
      url: getPageUrl(),
      settings: plainSettings(settings)
    }
    sendMessage('start-agent', data, 'background')
  } else {
    console.log('用户当前选择的是visible模式')
    const { downloadHandle } = useDownloadController(plainSettings(settings))
    await downloadHandle()
  }
}

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

const nativeMessageHandle = (
  message: unknown,
  sender: browser.Runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  // First, verify the message has the expected structure
  if (typeof message === 'object' && message !== null && 'type' in message) {
    const typedMessage = message as {
      type: keyof NativeMessageMap
      data: any
    }

    if (typedMessage.type === NativeMessageType.JOB_STATE_NOTIFY) {
      const data = typedMessage.data
      const handleNotification = async () => {
        switch (data.status) {
          case 1001:
            await showToast(NotificationMessage.SUBMITTING)
            break
          case 1002:
            await showToast(NotificationMessage.PACKAGING)
            break
          case 1003:
            taskStatus.value = StatusType.FINISHED
            await showToast(NotificationMessage.DOWNLOAD_COMPLETED, 'success', {
              duration: 15000,
              closeButton: true
            })
            break
          case 1004:
            taskStatus.value = StatusType.FAILED
            await showToast(NotificationMessage.CONTROLLER_ERROR, 'error', {
              duration: 15000,
              closeButton: true
            })
            break
        }
        sendResponse({ status: 'ok' })
      }

      handleNotification()
      return true
    }
  }

  // Return undefined for messages we don't handle
  return undefined
}

browser.runtime.onMessage.addListener(nativeMessageHandle)

onUnmounted(() => {
  browser.runtime.onMessage.removeListener(nativeMessageHandle)
  stopMouseTracker()
})

console.log('Referrer:', document.referrer)
console.log('Navigator.webdriver:', navigator.webdriver)
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
        :task-status="taskStatus"
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
