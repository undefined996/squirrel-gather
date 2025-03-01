import { onMessage, sendMessage } from 'webext-bridge/background'
import JSZip from 'jszip';
import { formatNumber, showNotification } from '~/utils/common'
import { Result } from '~/types';
import pLimit from 'p-limit';


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



onMessage('downloadResources', async (data) => {
  if (data) {
    console.log('data==============>', data)
  }

  await downloadSourceAsZip(data.data as Result)
  showNotification({ title: '资源下载成功', message: "请移步系统默认下载目录查验" });

  return {
    msg: '收到消息了',
    data
  }
})

// 并发下载，显著提升下载速度
const downloadSourceAsZip = async (data: Result) => {
  return new Promise<void>(async (resolve, reject) => {
    const zip = new JSZip();
    const limit = pLimit(5); // 限制并发请求数为 5

    try {


      if (data['isReadMe']) {
        const readmeContent = `访问地址: ${data.url || "无"}`;
        zip.file(`${data['title']}.txt`, readmeContent);
      }

      if (data['detailImages'] && data['detailImages'].length > 0) {
        await Promise.all(data['detailImages'].map((element, index) =>
          limit(async () => {
            const response = await fetch(element);
            const blob = await response.blob();
            const filename = element.endsWith('.png') || element.endsWith('.jpg') ? element.split('.').pop() : 'jpg'
            zip.file(`详情图片_${formatNumber(index + 1, 3)}.${filename}`, blob);
          })
        ));
      }

      if (data['mainImages'] && data['mainImages'].length > 0) {
        await Promise.all(data['mainImages'].map((element, index) =>
          limit(async () => {
            const response = await fetch(element);
            const blob = await response.blob();
            zip.file(`主图图片_${formatNumber(index + 1, 3)}.jpg`, blob);
          })
        ));
      }

      if (data['skus'] && data['skus'].length > 0) {
        let n = 0;
        await Promise.all(data['skus'].map((element) =>
          limit(async () => {
            if (element['url'] && element['label']) {
              const response = await fetch(element['url']);
              const blob = await response.blob();
              zip.file(`sku_${formatNumber(n + 1, 3)}_${element['label']}.jpg`, blob);
              n += 1;
            }
          })
        ));
      }

      if (data['mainVideoUrl']) {
        const response = await fetch(data['mainVideoUrl']);
        const blob = await response.blob();
        zip.file(`主图视频.mp4`, blob);
      }

      if (data['detailVideoUrl']) {
        const response = await fetch(data['detailVideoUrl']);
        const blob = await response.blob();
        zip.file(`详情视频.mp4`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const reader = new FileReader();
      reader.onloadend = function () {
        const dataUrl = reader.result;
        if (dataUrl && typeof dataUrl === 'string') { // 确保 dataUrl 是 string 类型
          chrome.downloads.download({
            url: dataUrl,
            filename: `${data['title']}.zip`,
            saveAs: false,
            conflictAction: "overwrite"
          });
          resolve(); // 下载成功，解析 Promise
        } else {
          reject(new Error('生成下载链接失败'));
        }
      };
      reader.readAsDataURL(content);
    } catch (error) {
      console.error('下载过程中发生错误:', error);
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        sendMessage('downloadResourcesFailed', { title: "资源下载失败，请重试" }, { context: 'content-script', tabId: activeTab.id })
      }
      reject(new Error('下载失败'));
    }
  });
};
