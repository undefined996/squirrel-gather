import {
  useDraggable
} from '@vueuse/core'


export function useDrag(elementRef: Ref<HTMLElement | null>, maxHeight: number = 268) {
  // 可拖拽功能
  const { y } = useDraggable(elementRef, {
    initialValue: {
      x: 0,
      y: 80
    },
    axis: 'y',
    preventDefault: true, // 禁止触发滚动
    onMove: (position) => {
      // 限制拖拽范围在窗口可视范围内
      const floatingButtonElement = elementRef.value as HTMLElement
      // 获取悬浮按钮的宽高等信息
      const rect = floatingButtonElement.getBoundingClientRect()
      const minY = 0
      const maxY = window.innerHeight - rect.height

      if (position.y < minY) {
        position.y = minY
      }
      if (position.y > maxY) {
        position.y = maxY
      }
    }
  })


  const adaptiveStyles = computed(() => {
    return window.innerHeight - y.value < maxHeight ? { bottom: '0' } : { top: '50%' }
  })

  return {
    y,
    adaptiveStyles
  };
}