<script setup lang="ts">
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import { Item, ModeType } from '~/types/schemas'

const extractionMode = useWebExtensionStorage<ModeType>(
  'extraction-mode',
  'hidden'
)

const supportList: Item[] = [
  {
    id: '1',
    name: '1688',
    status: true
  },
  {
    id: '2',
    name: '天猫商城',
    status: true
  },
  {
    id: '3',
    name: '淘宝商城',
    status: true
  },
  {
    id: '4',
    name: '京东商城',
    status: true
  },
  {
    id: '5',
    name: '1688跨境',
    status: false
  },
  {
    id: '6',
    name: '拼多多',
    status: false
  }
]

const version: string = 'v1.1.0'
</script>

<template>
  <main>
    <div class="bg-white box-shadow px-[24px] py-[20px] w-max">
      <!-- ✅ 新增提取模式切换区域 -->
      <div class="mb-4">
        <span class="block font-bold mb-2.5" text="[14px] gray-500"
          >模式选择</span
        >
        <div class="flex gap-x-4">
          <label
            class="cursor-pointer flex items-center gap-x-1"
            :class="{
              'text-brand font-600': extractionMode === 'visible',
              'text-gray-300': extractionMode !== 'visible'
            }"
          >
            <input
              type="radio"
              value="visible"
              v-model="extractionMode"
              class="w-4 h-4 rounded-full border border-gray-400 checked:border-4 checked:border-brand checked:bg-white appearance-none cursor-pointer"
            />
            常规模式
          </label>
          <label
            class="cursor-pointer flex items-center gap-x-1"
            :class="{
              'text-brand font-600': extractionMode === 'hidden',
              'text-gray-300': extractionMode !== 'hidden'
            }"
          >
            <input
              type="radio"
              value="hidden"
              v-model="extractionMode"
              class="w-4 h-4 rounded-full border border-gray-400 checked:border-4 checked:border-brand checked:bg-white appearance-none cursor-pointer"
            />
            无痕模式
          </label>
        </div>
      </div>

      <span class="block font-bold mb-2.5" text="[14px] gray-500"
        >支持列表展示</span
      >
      <div class="flex-col-center gap-y-1">
        <SupportItem
          v-for="item in supportList"
          :key="item.id"
          :name="item.name"
          :status="item.status"
        ></SupportItem>
      </div>
      <div class="text-gray-300 font-[5px] text-center mt-[16px]">
        版本号：{{ version }}
      </div>
    </div>
  </main>
</template>
