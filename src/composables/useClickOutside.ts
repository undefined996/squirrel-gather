import { useMouseInElement, useEventListener, Fn } from '@vueuse/core'

export const useClickOutside = (target: Ref<HTMLElement>, ignore: Ref<HTMLElement | null>[], handler: () => void, status: Ref<boolean>) => {
  let clickEventListener: Fn
  const { isOutside: isTargetOutside } = useMouseInElement(target)


  const isIgnoreOutside = ignore.length === 0 || ignore.map(item => {
    const { isOutside } = useMouseInElement(item)
    return isOutside
  }).every(item => item.value)


  const onClick = () => {
    if (isTargetOutside.value && isIgnoreOutside) {
      handler()
    }
  }

  // 监听 status 的变化
  watch(status, (newVal) => {
    if (newVal) {
      clickEventListener = useEventListener(document, 'click', onClick);
    } else {
      clickEventListener()
    }
  });

  onMounted(() => {
    if (status.value) {
      clickEventListener = useEventListener(document, 'click', onClick)
    }
  })

  onUnmounted(() => {
    clickEventListener()
  })
}