import { Hostname, NotificationMessage } from "~/constants";
import { JsonValue, Result, Settings, ToastOptions, ToastType } from "~/types";
import { delay, getPageUrl } from "~/utils/common";
import { sendMessage } from 'webext-bridge/content-script'
import { useCollectAliData } from "./useCollectAliData";
import { useCollectTmallData } from "./useCollectTmallData";

export function useDownload(isSubmit: Ref<boolean>, settings: Settings, showToast: (notificationMessageValue: NotificationMessage, type?: ToastType, options?: ToastOptions) => void) {


  // content---->background推送下载打包消息
  const sendToBackground = async (data: Result) => {
    const response = await sendMessage(
      'downloadResources',
      data as JsonValue,
      'background'
    )

    await delay(2000)
    showToast(NotificationMessage.PACKAGING);
    await delay(2000)

    if (response) {
      showToast(NotificationMessage.DOWNLOADING, 'success', { duration: 15000, closeButton: true })
    }
  }


  // downloadSubmitHandle(将下载任务提交到后台)
  const downloadHandle = async () => {
    try {
      isSubmit.value = true
      // 解析消息提示
      showToast(NotificationMessage.PARSING)

      let result: Result = {}
      const pageUrl = getPageUrl()
      const uri = new URL(pageUrl)
      const hostname = uri.hostname

      const { processAliData } = useCollectAliData(pageUrl)
      const { processTmallData } = useCollectTmallData(pageUrl)

      if (Hostname.ALI === hostname) {
        result = processAliData(
          settings
        )
      } else if (Hostname.TMALL === hostname || Hostname.TAOBAO === hostname) {
        result = await processTmallData(
          settings
        )
      }

      console.log('result==============>', result)

      // 提交后台下载打包消息提示
      showToast(NotificationMessage.COMMITTING)
      await sendToBackground(result)
    } catch (error) {
      console.log(error)
      showToast(NotificationMessage.ERROR, 'error', { duration: 15000, closeButton: true })
    } finally {
      isSubmit.value = false
    }
  }


  return {
    downloadHandle
  }
}