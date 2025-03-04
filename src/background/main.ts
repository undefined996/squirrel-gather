import { onMessage } from 'webext-bridge/background'
import { showNotification } from '~/utils/common'
import { Result, Response, JsonValue } from '~/types';
import useDownloadService from '~/composables/useDownloadService';


// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}


browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})



onMessage('downloadResources', async (data): Promise<Response> => {

  try {
    const { downloadSourceAsZip } = useDownloadService();
    const sourceData = data.data as Result

    console.log('sourceData===================>', sourceData)

    await downloadSourceAsZip(sourceData)
    showNotification({ title: '资源下载成功', message: "请移步系统默认下载目录查验" });
    return {
      code: 200,
      message: "下载打包请求处理完成",
      data: sourceData as JsonValue,
      source: "background",
      status: 'success'
    }

  } catch (error) {
    console.log("后端出现异常：", error)
    // 处理 error 的类型问题
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return {
      code: 500,
      message: "下载打包出现异常",
      data: errorMessage,
      source: "background",
      status: 'failed'
    }
  }

})