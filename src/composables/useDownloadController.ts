import { Hostname, NotificationMessage } from "~/constants";
import { JsonValue, Result, Settings, ToastOptions, ToastType, Response } from "~/types";
import { getPageUrl } from "~/utils/common";
import { sendMessage } from 'webext-bridge/content-script'
import { useCollectAliData } from "./useCollectAliData";
import { useCollectTmallData } from "./useCollectTmallData";
import { useCollectJDData } from "./useCollectJDData";

const useDownloadController = (isSubmit: Ref<boolean>,
  settings: Settings,
  showToast: (notificationMessageValue: NotificationMessage, type?: ToastType, options?: ToastOptions) => void) => {


  // content---->background推送下载打包消息
  const sendToBackground = async (data: Result) => {
    const response = await sendMessage<Response>(
      'downloadResources',
      data as JsonValue,
      'background'
    )

    await showToast(NotificationMessage.PACKAGING);

    if (response && response.code === 200 && response.status === 'success') {
      await showToast(NotificationMessage.DOWNLOAD_COMPLETED, 'success', { duration: 15000, closeButton: true })
    } else {
      await showToast(NotificationMessage.BACKGROUND_ERROR, 'error', { duration: 15000, closeButton: true })
    }
  }


  // downloadSubmitHandle(将下载任务提交到后台)
  const downloadHandle = async () => {
    try {
      isSubmit.value = true
      // 解析消息提示
      await showToast(NotificationMessage.STARTING)

      let result: Result = {}
      const pageUrl = getPageUrl()
      const uri = new URL(pageUrl)
      const hostname = uri.hostname

      const { processData: processAliData } = useCollectAliData(pageUrl)
      const { processData: processTmallData } = useCollectTmallData(pageUrl)
      const { processData: processJDData } = useCollectJDData(pageUrl)

      if (Hostname.ALI === hostname) {
        result = await processAliData(
          settings
        )
      } else if (Hostname.TMALL === hostname || Hostname.TAOBAO === hostname) {
        result = await processTmallData(
          settings
        )
      } else if (Hostname.JD === hostname) {
        result = await processJDData(
          settings
        )
      }

      console.log('result==============>', result)

      await showToast(NotificationMessage.SUBMITTING)
      // 提交后台下载打包消息提示
      await sendToBackground(result)
    } catch (error) {
      console.log("页面解析出现异常:", error)
      await showToast(NotificationMessage.CONTROLLER_ERROR, 'error', { duration: 15000, closeButton: true })
    } finally {
      isSubmit.value = false
    }
  }


  return {
    downloadHandle
  }
}

export default useDownloadController