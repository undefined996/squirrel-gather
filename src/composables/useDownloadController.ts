import { Hostname } from "~/constants";
import { Result, PlainSettings, RequestData } from "~/types/schemas";
import { getPageUrl } from "~/utils/common";
import { sendMessage } from 'webext-bridge/content-script'
import { useCollectAliData } from "./useCollectAliData";
import { useCollectTmallData } from "./useCollectTmallData";
import { useCollectJDData } from "./useCollectJDData";

const useDownloadController = (
  settings: PlainSettings, sourceId?: number) => {


  // content---->background推送下载打包消息
  const sendToBackground = (data: Result) => {
    const requestData: RequestData = {
      data,
      ...(sourceId !== undefined && { sourceId }), // ✅ 有则加，没有就不传
    }
    sendMessage(
      'download-resources',
      requestData,
      'background'
    )
  }


  // downloadSubmitHandle(将下载任务提交到后台)
  const downloadHandle = async () => {
    try {

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

      // 提交后台下载打包消息提示
      await sendToBackground(result)
    } catch (error) {
      console.log("页面解析出现异常:", error)
    }
  }


  return {
    downloadHandle
  }
}

export default useDownloadController