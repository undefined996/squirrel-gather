<script setup lang="ts">
import { Item } from '~/types'

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
    name: '阿里国际',
    status: false
  },
  {
    id: '6',
    name: '拼多多',
    status: false
  }
]

const version: string = 'v1.0.1'
</script>

<template>
  <main>
    <div class="bg-white box-shadow px-[24px] py-[20px] w-max">
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
