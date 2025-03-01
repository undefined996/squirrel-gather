<template>
  <div class="flex-row-between gap-x-[48px]">
    <span class="text-gray-300" :style="{ fontSize }">
      {{ label }}
    </span>

    <input type="checkbox" class="hidden" v-model="isChecked" />
    <label
      class="w-[36px] h-[20px] rounded-full relative"
      :class="[isChecked ? checkedColor : bgColor]"
      @click="isChecked = !isChecked"
    >
      <span
        class="absolute w-[14px] h-[14px] top-[50%] rounded-full -translate-x-[50%] -translate-y-[50%]"
        :class="[ballColor, isChecked ? 'left-[28%]' : 'left-[72%]']"
      ></span>
    </label>
  </div>
</template>

<script setup lang="ts">
// 定义类型
interface SwitchWithLabelProps {
  label?: string
  fontSize?: string
  checkedColor?: string
  bgColor?: string
  ballColor?: string
}

// 定义组件默认值
withDefaults(defineProps<SwitchWithLabelProps>(), {
  label: '待设置项',
  fontSize: '12px',
  checkedColor: 'bg-brand',
  bgColor: 'bg-gray',
  ballColor: 'bg-white'
})

// 定义双向绑定属性值（3.4+新特性，简化代码）
const isChecked = defineModel<boolean>({ default: false })
</script>
