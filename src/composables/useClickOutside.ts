import { useMouseInElement, useEventListener, Fn } from '@vueuse/core'


/**
 * 如果 ignore 元素是不频繁变动的
 * @param target 
 * @param handler 
 * @param status 
 * @param ignore 
 */
export const useStaticClickOutside = (target: Ref<HTMLElement>,
  handler: () => void,
  status: Ref<boolean>,
  ignore: Ref<HTMLElement>[] = []) => {

  // 初始化点击监听器
  let clickEventListener: Fn = () => { }

  const { isOutside: isTargetOutside } = useMouseInElement(target)

  const ignoreStates = ref(new Map())

  watch(ignore, () => {
    const newMap = new Map()
    ignore?.forEach(item => {
      newMap.set(item, useMouseInElement(item).isOutside)
    })
    ignoreStates.value = newMap
  })

  const isOutsideIgnore = computed(() => {
    if (!ignore || ignore.length === 0) return true
    return Array.from(ignoreStates.value.values()).every(state => state.value)
  })

  const onClick = () => {
    if (isTargetOutside.value && isOutsideIgnore) {
      handler()
    }
  }

  // 监听 status 的变化
  watch(status, (newVal) => {
    if (newVal) {
      clickEventListener = useEventListener(document, 'click', onClick);
    } else {
      clickEventListener() // 移除事件监听
    }
  });

  // 根据条件判断是否要动态绑定
  onMounted(() => {
    if (status.value) {
      clickEventListener = useEventListener(document, 'click', onClick)
    }
  })

  // 及时解绑释放资源
  onUnmounted(() => {
    clickEventListener()
  })
}


/**
 * 如果 ignore 元素是频繁变动的
 * @param target 
 * @param handler 
 * @param status 
 * @param ignore 
 */
export const useDynamicClickOutside = (target: Ref<HTMLElement>,
  handler: () => void,
  status: Ref<boolean>,
  ignore: Ref<HTMLElement>[] | undefined = []) => {



  // 初始化点击监听器
  let clickEventListener: Fn = () => { }

  const ignoreStates = ref(new Map())

  watch(ignore, () => {
    const newMap = new Map()
    ignore?.forEach(item => {
      newMap.set(item, useMouseInElement(item).isOutside)
    })
    ignoreStates.value = newMap
  })

  const isOutsideIgnore = computed(() => {
    if (!ignore || ignore.length === 0) return true
    return Array.from(ignoreStates.value.values()).every(state => state.value)
  })

  // 保存 target 的 isOutside 状态
  const targetState = ref(false)

  // 创建外部监听器
  const createListeners = () => {
    // 创建 target 的监听器
    const { isOutside: isTargetOutside } = useMouseInElement(target)
    targetState.value = isTargetOutside.value
  }

  // 销毁外部监听器
  const destroyListeners = () => {
    targetState.value = false
  }

  // 点击事件处理函数
  const onClick = (event: MouseEvent) => {
    // 如果点击的目标是 target 自身，直接返回
    // 生产环境shadow root 默认配置是close，只能通过elementFromPoint点位获取具体的点击位置
    const shadowRoot = target.value?.getRootNode() as ShadowRoot | null
    let clickedElement = event.target as Node
    if (shadowRoot?.elementFromPoint) {
      clickedElement = shadowRoot.elementFromPoint(event.clientX, event.clientY) || clickedElement
    }
    if (target.value?.contains(clickedElement)) {
      return
    }

    // 如果鼠标在 target 外部
    if (targetState.value) {
      // 如果鼠标在所有 ignore 元素之外，调用 handler
      if (isOutsideIgnore) {
        handler()
      }
    }
  }

  // 监听 status 的变化
  watch(status, (newVal) => {
    if (newVal) {
      createListeners()
      clickEventListener = useEventListener(document, 'click', onClick)
    } else {
      destroyListeners()
      clickEventListener() // 移除事件监听
    }
  })

  // 组件挂载时，根据 status 的初始值决定是否绑定事件
  onMounted(() => {
    if (status.value) {
      createListeners()
      clickEventListener = useEventListener(document, 'click', onClick)
    }
  })

  // 及时解绑释放资源
  onUnmounted(() => {
    destroyListeners()
    clickEventListener()
  })
}