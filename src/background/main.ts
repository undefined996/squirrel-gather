import { onMessage, sendMessage } from 'webext-bridge/background'
import { showNotification } from '~/utils/common'
import useDownloadService from '~/composables/useDownloadService';
import { sendNativeMessage } from '~/utils/native-message';
import { NativeMessageType } from '~/types/native-message-protocol';


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



onMessage('download-resources', async (data) => {
  const sourceData = data.data.data
  const senderId = data.sender.tabId
  const sourceId = data.data.sourceId
  const contentTabId = sourceId ? sourceId : senderId

  try {
    await sendNativeMessage(NativeMessageType.JOB_STATE_NOTIFY, {
      status: 1001,
      message: '提交后台处理中',
    }, contentTabId);

    const { downloadSourceAsZip } = useDownloadService();
    console.log('sourceData===================>', sourceData)


    await sendNativeMessage(NativeMessageType.JOB_STATE_NOTIFY, {
      status: 1002,
      message: '资源打包中',
    }, contentTabId);


    await downloadSourceAsZip(sourceData)
    showNotification({ title: '资源下载成功', message: "请移步系统默认下载目录查验" });
    await sendNativeMessage(NativeMessageType.JOB_STATE_NOTIFY, {
      status: 1003,
      message: '资源下载成功',
    }, contentTabId);

  } catch (error) {
    console.log("后端出现异常：", error)
    // 处理 error 的类型问题
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    await browser.tabs.sendMessage(contentTabId, {
      type: "notification",
      data: {
        code: 1004,
        message: "失败请重试",
        detailMessage: errorMessage
      },
    })

  }
  if (senderId && senderId !== sourceId) {
    try {
      const tab = await chrome.tabs.get(senderId)
      const windowId = tab.windowId
      await chrome.windows.remove(windowId)
      console.log(`Window ${windowId} closed`)

    } catch (err) {
      console.warn('Failed to close window:', err)
    }
  }
})


// 监听代理启用消息通知
onMessage('start-agent', async (data) => {
  const agentArgs = data.data
  const { url } = agentArgs
  const sourceId = data.sender.tabId

  chrome.windows.create({
    url,
    type: 'popup',
    state: "minimized"
  }, (win) => {
    if (!win || !win.tabs || !win.tabs[0]) {
      console.warn('Failed to create window or retrieve tab');
      return;
    }

    const tabId = win.tabs[0].id!;
    if (!tabId) return;

    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);

        chrome.scripting.executeScript({
          target: { tabId },
          files: [
            './dist/contentScripts/agent.global.js'
          ]
        }, () => {
          sendMessage('agent-param-sync', { ...agentArgs, sourceId }, { context: 'content-script', tabId })
        });
      }
    });
  });
})
