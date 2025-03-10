import JSZip from 'jszip';
import { formatNumber } from '~/utils/common'
import { Result } from '~/types';
import pLimit from 'p-limit';

const useDownloadService = () => {
  const fetchAndSaveFile = async (zip: JSZip, url: string, filename: string, limit: ReturnType<typeof pLimit>) => {
    return limit(async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`下载失败: ${url}`);
        const blob = await response.blob();

        // 释放 Blob 之前，先转换为 ArrayBuffer
        const arrayBuffer = await new Response(blob).arrayBuffer();
        zip.file(filename, arrayBuffer); // 存入 ArrayBuffer，释放 Blob 资源
      } catch (error) {
        console.error(`文件下载失败: ${filename}`, error);
      }
    });
  };

  const downloadSourceAsZip = async (data: Result) => {
    return new Promise<void>(async (resolve, reject) => {
      const zip = new JSZip();
      const allTasks = [
        ...(data.detailImages ?? []),
        ...(data.mainImages ?? []),
        ...(data.skus ?? []).map(sku => sku.url).filter(Boolean),
        data.mainVideoUrl,
        data.detailVideoUrl
      ].filter(Boolean);

      const taskCount = allTasks.length;
      const limit = pLimit(Math.min(Math.max(taskCount, 1), 5));
      console.log('current limit n =======>', Math.min(Math.max(taskCount, 1), 5))

      try {
        if (data.isReadMe) {
          zip.file(`!README_${data.title}.txt`, `访问地址: ${data.url || "无"}`);
        }

        await Promise.all([
          ...(data.detailImages?.map((url, index) =>
            fetchAndSaveFile(zip, url, `详情图片_${formatNumber(index + 1, 3)}.jpg`, limit)
          ) ?? []),

          ...(data.mainImages?.map((url, index) =>
            fetchAndSaveFile(zip, url, `主图图片_${formatNumber(index + 1, 3)}.jpg`, limit)
          ) ?? []),

          ...(data.skus?.map((sku, index) => {
            if (sku.url) {
              return fetchAndSaveFile(zip, sku.url, `sku_${formatNumber(index + 1, 3)}_${sku.label}.jpg`, limit);
            } else {
              zip.file(`sku_${formatNumber(index + 1, 3)}_${sku.label}(无sku图片).txt`, '');
            }
          }) ?? []),

          data.mainVideoUrl ? fetchAndSaveFile(zip, data.mainVideoUrl, `主图视频.mp4`, limit) : null,
          data.detailVideoUrl ? fetchAndSaveFile(zip, data.detailVideoUrl, `详情视频.mp4`, limit) : null
        ].filter(Boolean));

        const content = await zip.generateAsync({ type: "blob" });

        // **FileReader 只触发一次**
        const reader = new FileReader();
        reader.onloadend = function () {
          const dataUrl = reader.result;
          if (typeof dataUrl === 'string') {
            chrome.downloads.download({
              url: dataUrl,
              filename: `${data.title}.zip`,
              saveAs: false,
              conflictAction: "overwrite"
            });
            resolve();
          } else {
            reject(new Error('生成下载链接失败'));
          }
        };

        // **释放资源：避免直接存 `Blob`**
        reader.readAsDataURL(content);
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    downloadSourceAsZip,
  };
};

export default useDownloadService;
