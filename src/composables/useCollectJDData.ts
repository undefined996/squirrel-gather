import { SettingsHandler, Sku, TaskType, PlatformHandler } from "~/types/schemas";
import { completeUrlProtocol, delay, normalizeText, isInViewport } from "~/utils/common";
import { useCollectData } from '~/composables/useCollectData'


// 京东视图筛选器统一配置
export const JD_SELECTORS = {
  titleFilterLabel: '.sku-name-title',
  titleFilterName: '.sku-name',
  skuFilter: '#choose-attrs .dd a',
  mainImagesFilter: "#spec-list .lh img",
  mainVideoIconFilter: '.video-play-icon',
  mainVideoEleFilter: '#video-player_html5_api',
  detailImagesFilterByStyle: '#J-detail-content style',
  detailImagesFilterByImg: '#J-detail-content img',
  detailImagesFilterRootId: '#J-detail-content'
};



// 去除url尾缀.avif
const removeAvifSuffix = (imgSrc: string): string => {
  return imgSrc.endsWith('.avif') ? imgSrc.replace('.avif', '') : imgSrc
}


// 主图url格式化
const formatMainImageUrl = (url: string, rightArg: string = '/s800x800_jfs/'): string => {
  if (url.includes('_jfs')) {
    return url.replace(/\/s\d+x\d+_jfs\//, rightArg)
  }

  return url.replace(/\/jfs\//, rightArg)
}



const jdHandlers: PlatformHandler = {
  // 获取标题信息(统一转换为异步)
  handleTitle: // 获取标题信息(统一转换为异步)
    async function handleTitle(): Promise<string> {
      // 查询 .sku-name-title 和 .sku-name
      const titleElement1 = document.querySelector(JD_SELECTORS.titleFilterLabel) as HTMLElement | null;
      const titleElement2 = document.querySelector(JD_SELECTORS.titleFilterName) as HTMLElement | null;

      // 如果 .sku-name-title 存在，返回它的文本内容；如果不存在，返回 .sku-name 的文本内容
      const title = titleElement1 ? normalizeText(titleElement1.textContent || '') :
        (titleElement2 ? normalizeText(titleElement2.textContent || '') : '');

      return title;
    },


  // 获取sku名称及图片信息(统一转换为异步)
  handleSkus: async (): Promise<Sku[]> => {

    const rst: Sku[] = [];

    const elements = document.querySelectorAll(JD_SELECTORS.skuFilter)
    if (elements.length > 0) {
      elements.forEach(element => {
        const imgSrc = element.querySelector("img")?.getAttribute('src')
        const label = element?.textContent?.trim() || element.querySelector("i")?.textContent?.trim()
        // TODO:可能存在有标签没有图片的情况
        if (label) {
          const rightSizeImgSrc = imgSrc ? formatMainImageUrl(imgSrc) : ''
          rst.push({
            label: normalizeText(label),
            url: completeUrlProtocol(removeAvifSuffix(rightSizeImgSrc)),
          });
        }
      })
    }

    return rst
  },


  // 获取主图(统一转换为异步)
  // TODO:京东点击SKU后主图会变化：当前只提取了默认selected sku对应的主图
  handleMainImages: async (): Promise<string[]> => {
    const imgElements = document.querySelectorAll(JD_SELECTORS.mainImagesFilter);
    return Array.from(imgElements)
      .map((element) => element.getAttribute('src'))
      .filter((url): url is string => url !== null)
      .map((url) => {

        const replaceImgSrc = formatMainImageUrl(url)
        const imgSrc = removeAvifSuffix(replaceImgSrc)
        return completeUrlProtocol(imgSrc)
      })
  },

  // 获取主图视频地址
  handleMainVideo: (): Promise<string> => {

    const timeout = 3000; // 超时时间
    const delayMs = 100; // 触发 mouseover 事件的延迟时间（100ms）

    return new Promise(async (resolve) => {
      try {
        // 查找 .video-play-icon 元素
        const videoPlayIcon = document.querySelector(JD_SELECTORS.mainVideoIconFilter);
        if (!videoPlayIcon) {
          resolve('');
          return;
        }

        // 判断 videoPlayIcon 是否在视口中，如果不在，滚动到视口中
        if (!isInViewport(videoPlayIcon)) {
          videoPlayIcon.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // 获取父节点
        const parentElement = videoPlayIcon.parentElement;
        if (!parentElement) {
          resolve('');
          return;
        }

        // 获取父节点的兄弟节点
        const siblingElement = parentElement.previousElementSibling || parentElement.nextElementSibling;
        if (!siblingElement) {
          resolve('');
          return;
        }

        // 触发 mouseover 事件
        const triggerMouseOver = (element: Element) => {
          const mouseOverEvent = new MouseEvent('mouseover', {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          element.dispatchEvent(mouseOverEvent);
        };

        // 增加延迟触发 mouseover 事件

        triggerMouseOver(siblingElement); // 触发兄弟节点的 mouseover 事件
        await delay(delayMs) // 增加延迟操作
        triggerMouseOver(parentElement); // 触发父节点的 mouseover 事件

        // 使用 MutationObserver 监听视频元素
        let observer: MutationObserver | null = null;
        const videoSrcPromise = new Promise<string>((resolve) => {
          observer = new MutationObserver(() => {
            const videoElement = document.querySelector(JD_SELECTORS.mainVideoEleFilter);
            if (videoElement) {
              const videoSrc = videoElement.getAttribute('src');
              resolve(videoSrc || '');
              observer?.disconnect(); // 停止观察
            }
          });

          // 开始观察文档的变化
          observer.observe(document.body, { childList: true, subtree: true });

          // 立即检查一次，避免遗漏
          const videoElement = document.querySelector(JD_SELECTORS.mainVideoEleFilter);
          if (videoElement) {
            const videoSrc = videoElement.getAttribute('src');
            resolve(videoSrc || '');
            observer.disconnect(); // 停止观察
          }
        });

        // 设置超时机制
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve('');
            observer?.disconnect(); // 停止观察
          }, timeout);
        });

        // 使用 Promise.race 竞争视频地址获取和超时
        Promise.race([videoSrcPromise, timeoutPromise]).then(resolve);
      } catch (error) {
        console.error('处理主图视频地址时发生错误:', error);
        resolve('');
      }
    });
  },


  // 获取详情页图片（优化后）
  handleDetailImages: async (): Promise<string[]> => {
    // 基于正则表达式提取图片地址
    const getImageSrcByRegex = () => {
      const element = document.querySelector(JD_SELECTORS.detailImagesFilterByStyle);
      const cssContent = element?.textContent;

      if (cssContent) {
        // 正则表达式匹配 background-image: url(...)
        const regex = /background-image:\s*url\(([^)]+)\)/g;

        // 使用 match 方法一次性匹配所有 URL
        const matches = cssContent.match(regex);

        return matches
          ? matches
            .map(match => match.replace(/background-image:\s*url\(([^)]+)\)/, '$1'))
            .map(match => completeUrlProtocol(removeAvifSuffix(match)))
          : [];
      }
      return [];
    };

    // 基于DOM提取图片地址
    const getImageSrcByDom = () => {
      const result: any = [];
      // 情况2：dom直接提取
      const elements = document.querySelectorAll(JD_SELECTORS.detailImagesFilterByImg);
      elements.forEach(element => {
        const imageSrc = element.getAttribute('src');
        const lazyImageSrc = element.getAttribute('data-lazyload');

        if (imageSrc) {
          const imageUrl = imageSrc.endsWith('.gif') ? (lazyImageSrc ? lazyImageSrc : '') : imageSrc
          result.push(completeUrlProtocol(removeAvifSuffix(imageUrl)));
        }
      });
      return result;
    };

    const rootEle = document.querySelector(JD_SELECTORS.detailImagesFilterRootId)
    if (rootEle) {
      rootEle.scrollIntoView()
      await delay(100);
    }

    const regexHandleResult = getImageSrcByRegex();
    const domHandleResult = getImageSrcByDom();

    return [...regexHandleResult, ...domHandleResult];
  }
}

// 定义京东的settingsHandlers
const jdSettingsHandlers: SettingsHandler<any>[] = [
  { key: 'isSkus', handler: jdHandlers.handleSkus, resultKey: 'skus', defaultValue: [], taskType: TaskType.CONCURRENT },
  { key: 'isMainVideo', handler: jdHandlers.handleMainVideo, resultKey: 'mainVideoUrl', defaultValue: '', taskType: TaskType.SEQUENTIAL },
  { key: 'isMainImages', handler: jdHandlers.handleMainImages, resultKey: 'mainImages', defaultValue: [], taskType: TaskType.CONCURRENT },
  { key: 'isDetailImages', handler: jdHandlers.handleDetailImages, resultKey: 'detailImages', defaultValue: [], taskType: TaskType.SEQUENTIAL },
];


export function useCollectJDData(url: string) {
  return useCollectData(jdHandlers, jdSettingsHandlers, url);
}