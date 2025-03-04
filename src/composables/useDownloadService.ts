import JSZip from 'jszip';
import { formatNumber } from '~/utils/common'
import { Result } from '~/types';
import pLimit from 'p-limit';

const useDownloadService = () => {


  // 并发下载提升下载速度
  const downloadSourceAsZip = async (data: Result) => {
    return new Promise<void>(async (resolve, reject) => {
      const zip = new JSZip();
      const limit = pLimit(5); // 限制并发请求数为 5

      try {

        if (data['isReadMe']) {
          const readmeContent = `访问地址: ${data.url || "无"}`;
          zip.file(`!README_${data['title']}.txt`, readmeContent);
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
              if (element['label']) {
                if (element['url']) {
                  // 如果 URL 存在，下载图片并添加到 ZIP
                  const response = await fetch(element['url']);
                  const blob = await response.blob();
                  zip.file(`sku_${formatNumber(n + 1, 3)}_${element['label']}.jpg`, blob);
                } else {
                  // 如果 URL 不存在，添加一个空的文本文件
                  zip.file(`sku_${formatNumber(n + 1, 3)}_${element['label']}(无sku图片).txt`, '');
                }
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
        // console.error('下载压缩出现异常:', error);
        // const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        // if (activeTab?.id) {
        //   sendMessage('downloadResourcesFailed', {}, { context: 'content-script', tabId: activeTab.id })
        // }
        reject(error);
      }
    });
  };


  return {
    downloadSourceAsZip,
  };
};

export default useDownloadService;