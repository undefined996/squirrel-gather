import { Sku, PlatformHandler, SettingsHandler, TaskType } from '../types'
import { completeUrlProtocol, delay, normalizeText, removeDashAndAfter } from '../utils/common'
import { useCollectData } from './useCollectData';


// 天猫视图筛选器统一配置
export const TMALL_SELECTORS = {
  titleContent: '#tbpc-detail-item-title',
  headTitleContent: 'head title',
  skuFilter: '[class*="valueItemImg"][placeholder]',
  mainImage: 'img[class*="thumbnailPic"]',
  mainVideo: 'video#videox-video-el',
  mainSwitchTab: 'div[class*="switchTabsItem"]',
  detailImageFilter1: 'img[data-name="singleImage"].descV8-singleImage-image.lazyload',
  detailImageFilter2: 'img[align="absmiddle"].lazyload',
  invalidDetailImageKeyInfo: '6000000008132-2-tps-750-880.png'
};



const tmallHandlers: PlatformHandler = {
  // 获取标题信息
  // 天猫标题scroll后会消失，改为从head.title中获取标题，head标题需要解析处理
  handleTitle: async (): Promise<string> => {

    // const getTitleById = () => {
    //   let parentElement = document.querySelector(TMALL_SELECTORS.titleContent);
    //   const h1Element = parentElement?.querySelector('h1');
    //   return (h1Element?.textContent?.trim() || '').replace(/\//, '_')
    // }

    const headTitleElement = document.querySelector(TMALL_SELECTORS.headTitleContent);
    const headTitleTextContent = headTitleElement?.textContent;
    if (!headTitleElement || !headTitleTextContent) {
      return ''; // 如果没有找到 head 标题元素或标题内容为空，直接返回空字符串
    }

    // 获取 head 标题内容并处理
    const processedTitle = normalizeText(removeDashAndAfter(headTitleTextContent, '-'))

    return processedTitle || '';
  },

  // 获取sku名称及图片信息
  handleSkus: async (): Promise<Sku[]> => {
    const rst: Sku[] = [];

    const loadImages = async (elements: NodeListOf<Element>) => {
      const elementArray = Array.from(elements);
      for (const element of elementArray) {
        const baseUrl = element.getAttribute('src');
        if (baseUrl && baseUrl.endsWith('.png')) {
          element.scrollIntoView();
          await delay(100);
        }
      }
    };

    const extractSkuInfo = (elements: NodeListOf<Element>) => {
      elements.forEach((element) => {
        const imgSrc = element.getAttribute('src');
        const labelElement = element.nextElementSibling;

        if (labelElement) {
          const title = labelElement.getAttribute('title');
          if (title && imgSrc) {
            rst.push({
              label: normalizeText(title),
              url: completeUrlProtocol(imgSrc),
            });
          }
        }
      });
    };

    let elements = document.querySelectorAll(TMALL_SELECTORS.skuFilter);
    if (elements.length > 0) {
      await loadImages(elements);
    }

    elements = document.querySelectorAll(TMALL_SELECTORS.skuFilter);
    if (elements.length > 0) {
      extractSkuInfo(elements);
    }

    return rst;
  },


  // 获取主图
  handleMainImages: async (): Promise<string[]> => {
    const imgElements = document.querySelectorAll(TMALL_SELECTORS.mainImage);
    return Array.from(imgElements)
      .map((element) => element.getAttribute('src'))
      .filter((url): url is string => url !== null)
      .map((url) => (completeUrlProtocol(url)));
  },



  // 获取主图视频
  handleMainVideo: async (): Promise<string> => {
    const TIMEOUT_DURATION = 3000; // 3秒超时

    try {
      const baseElement = document.querySelector('div[class*="switchTabsWrap"][data-appeared="true"]');
      if (!baseElement) {
        return '';
      }

      const getVideoSrc = (): string | null => {
        const videoElement = document.querySelector(TMALL_SELECTORS.mainVideo);
        const src = videoElement?.getAttribute('src')?.trim() || null;
        return src ? completeUrlProtocol(src) : null;
      };

      // 先检查是否已经有视频元素存在
      let videoSrc = getVideoSrc();
      if (videoSrc) {
        return videoSrc;
      }

      // 如果没有找到视频资源，通过点击显示的查找
      const elements = baseElement.querySelectorAll(TMALL_SELECTORS.mainSwitchTab);
      elements.forEach((element) => {
        if (element instanceof HTMLElement && element.textContent?.trim() === '视频') {
          element.click();
        }
      });

      // 等待页面加载视频资源
      await new Promise(resolve => setTimeout(resolve, 100));

      // 使用 MutationObserver 获取视频地址
      let observer: MutationObserver | null = null; // 将 observer 提到外层，方便在超时情况下断开
      const videoSrcPromise = new Promise<string>((resolve) => {
        observer = new MutationObserver(() => {
          const src = getVideoSrc();
          if (src) {
            observer?.disconnect(); // 找到视频地址后断开监听
            resolve(src);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // 检查是否有视频资源加载完成
        const src = getVideoSrc();
        if (src) {
          observer.disconnect(); // 如果已经有视频地址，直接断开监听
          resolve(src);
        }
      });

      // 设置超时
      const timeoutPromise = new Promise<string>((resolve) => {
        setTimeout(() => {
          if (observer) {
            observer.disconnect(); // 超时后断开监听
          }
          resolve('');
        }, TIMEOUT_DURATION);
      });

      // 使用 Promise.race 来竞争超时和视频地址获取
      return await Promise.race([videoSrcPromise, timeoutPromise]);

    } catch (error) {
      console.error('错误:', error);
      return ''; // 错误时返回空字符串
    }
  },


  // 获取详情页图片（优化后）
  handleDetailImages: async (): Promise<string[]> => {
    const maxRetries = 3; // 最大重试次数
    const retryCount = 0; // 当前重试次数
    const rst: string[] = [];
    const detailImageFilter1 = '.descV8-richtext img[align="absmiddle"].lazyload,.descV8-richtext img[align="absmiddle"]:not(.lazyload)';
    const detailImageFilter2 = '.descV8-singleImage img[data-name="singleImage"].descV8-singleImage-image.lazyload';


    // 获取图片元素
    const getImageElements = () => {
      const filter1 = Array.from(document.querySelectorAll(detailImageFilter1));
      const filter2 = Array.from(document.querySelectorAll(detailImageFilter2));
      return [...filter1, ...filter2];
    };

    // 滚动到最后一个图片元素
    const scrollToLastImage = (elements: string | any[] | NodeListOf<Element>) => {
      if (elements.length > 0) {
        elements[elements.length - 1].scrollIntoView({ behavior: 'smooth' });
      }
    };

    // 提取图片 URL
    const extractImageUrls = (elements: string | any[] | NodeListOf<Element>) => {
      for (let i = 0; i < elements.length - 1; i++) {
        const ele = elements[i]
        const src = ele.getAttribute('src');
        const dataSrc = ele.getAttribute('data-src');
        const url = src !== '//g.alicdn.com/s.gif' ? src : dataSrc;

        if (url) {
          rst.push(url.startsWith('//') ? window.location.protocol + url : url);
        }
      }
    };

    // 检查是否有未成功获取的 URL
    const checkForInvalidUrls = () => {
      // 6000000001963-2-tps-790-300.png filter1的懒加载图片
      // 6000000008132-2-tps-750-880.png filter2的懒加载图片
      return rst.some((item) => item.includes('6000000001963-2-tps-790-300.png') || item.includes('6000000008132-2-tps-750-880.png'));
    };

    // 主逻辑
    let elements = getImageElements();
    if (elements.length > 0) {
      scrollToLastImage(elements);
      await delay(1000); // 等待 1 秒，确保页面加载完成
      elements = getImageElements();
      extractImageUrls(elements);
    }

    const check = checkForInvalidUrls();
    if (check && retryCount < maxRetries) {
      // 如果存在未成功获取的 URL，并且未达到最大递归次数，则递归调用
      await delay(1000); // 等待 1 秒，确保页面加载完成
      return tmallHandlers.handleDetailImages();
    }

    // window.scrollTo({
    //   top: 0,
    //   behavior: 'smooth'
    // });

    return rst;
  }
}

// 定义京东的settingsHandlers
const tmallSettingsHandlers: SettingsHandler<any>[] = [
  { key: 'isSkus', handler: tmallHandlers.handleSkus, resultKey: 'skus', defaultValue: [], taskType: TaskType.SEQUENTIAL },
  { key: 'isMainVideo', handler: tmallHandlers.handleMainVideo, resultKey: 'mainVideoUrl', defaultValue: '', taskType: TaskType.SEQUENTIAL },
  { key: 'isMainImages', handler: tmallHandlers.handleMainImages, resultKey: 'mainImages', defaultValue: [], taskType: TaskType.CONCURRENT },
  { key: 'isDetailImages', handler: tmallHandlers.handleDetailImages, resultKey: 'detailImages', defaultValue: [], taskType: TaskType.SEQUENTIAL },
];


export function useCollectTmallData(url: string) {
  return useCollectData(tmallHandlers, tmallSettingsHandlers, url);
}