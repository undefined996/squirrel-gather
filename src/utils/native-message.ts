import { NativeMessageMap } from '~/types/native-message-protocol'


export function sendNativeMessage<K extends keyof NativeMessageMap>(
  type: K,
  data: NativeMessageMap[K],
  tabId?: number
): Promise<any> {
  const payload = {
    type, data
  }
  if (tabId != null) {
    return browser.tabs.sendMessage(tabId, payload)
  } else {
    return browser.runtime.sendMessage(payload)
  }
}