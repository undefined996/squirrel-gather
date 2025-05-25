
import { onMessage } from 'webext-bridge/content-script'
import useDownloadController from '~/composables/useDownloadController'
import { generateObserverTargetNodeRule } from '~/utils/common';


// 防止SPA异步渲染导致数据无法抓取
function waitForRenderReady(nodeRule: string): Promise<void> {
  return new Promise((resolve) => {
    const targetNode = document.querySelector(nodeRule)

    if (targetNode) {
      return resolve();
    }

    const observer = new MutationObserver(() => {
      const targetNode = document.querySelector(nodeRule)
      if (targetNode) {
        console.log('✅ Agent页面渲染完成，开始抓取数据');
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document, { subtree: true, childList: true });
  });
}



// 监听参数同步消息通知
onMessage('agent-param-sync', async (data) => {
  let shouldSkip = false
  const { url, settings, sourceId } = data.data;
  console.log('获取到的sourceId======>', sourceId)

  if (!sourceId) {
    console.warn("代理tab没有获取到目标tabId");
    shouldSkip = true
  }
  try {
    if (!shouldSkip) {
      await waitForRenderReady(generateObserverTargetNodeRule(url))
      const { downloadHandle } = useDownloadController(settings, sourceId!);
      await downloadHandle();
    }
  } catch (error) {
    console.error('下载过程中发生错误:', error);
  }
});

