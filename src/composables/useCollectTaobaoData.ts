import { Sku, Result } from '../types'
import { delay } from '../utils/common'


// 淘宝视图筛选器统一配置
export const TAOBAO_SELECTORS = {
  titleContent: '#tbpc-detail-item-title',
  skuFilter: '[class*="valueItemImg"][placeholder]',
  mainImage: 'img[class*="thumbnailPic"]',
  mainVideo: 'video.lib-video',
  mainSwitchTab: 'div[class*="switchTabsItem"]',
  detailImageFilter1: 'img[data-name="singleImage"].descV8-singleImage-image.lazyload',
  detailImageFilter2: 'img[align="absmiddle"].lazyload',
  invalidDetailImageKeyInfo: '6000000008132-2-tps-750-880.png'
};


export function useCollectTaobaoData() {

  // 获取标题信息
  const handleTitle = (): string => {
    let parentElement = document.querySelector(TAOBAO_SELECTORS.titleContent);
    const h1Element = parentElement?.querySelector('h1');
    return h1Element?.textContent?.trim() || ''

  };


  // 获取sku名称及图片信息
  const handleSkus = async (): Promise<Sku[]> => {
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
              label: title.replace(/\//g, '_'),
              url: imgSrc.startsWith('//') ? `${window.location.protocol}${imgSrc}` : imgSrc,
            });
          }
        }
      });
    };

    let elements = document.querySelectorAll(TAOBAO_SELECTORS.skuFilter);
    if (elements.length > 0) {
      await loadImages(elements);
    }

    elements = document.querySelectorAll(TAOBAO_SELECTORS.skuFilter);
    if (elements.length > 0) {
      extractSkuInfo(elements);
    }

    return rst;
  }


  // 获取主图
  const handleMainImages = (): string[] => {
    const imgElements = document.querySelectorAll(TAOBAO_SELECTORS.mainImage);
    return Array.from(imgElements)
      .map((element) => element.getAttribute('src'))
      .filter((url): url is string => url !== null)
      .map((url) => (url.startsWith('//') ? `${window.location.protocol}${url}` : url));
  };

  // 获取视频地址
  const handleMainVideo = async (): Promise<string> => {
    try {
      // 判断是否有视频资源视图元素
      const baseElement = document.querySelector('div[class*="switchTabsWrap"][data-appeared="true"]')
      if (baseElement) {
        const getVideoSrc = (): string | null => {
          const videoElement = document.querySelector(TAOBAO_SELECTORS.mainVideo);
          const src = videoElement?.getAttribute('src')?.trim() || null;
          return src ? (src.startsWith('//') ? `${window.location.protocol}${src}` : src) : null;
        };

        // 先检查是否已经有视频元素存在
        let videoSrc = getVideoSrc();
        if (videoSrc) {
          return videoSrc;
        }

        // 如果没有找到视频资源，通过点击显示的查找
        const elements = baseElement.querySelectorAll(TAOBAO_SELECTORS.mainSwitchTab);
        elements.forEach((element) => {
          if (element instanceof HTMLElement && element.textContent?.trim() === '视频') {
            element.click();
          }
        });

        // 等待页面加载视频资源
        await delay(100);

        // 使用 MutationObserver 获取视频地址
        videoSrc = await new Promise<string>((resolve) => {
          const observer = new MutationObserver(() => {
            const src = getVideoSrc();
            if (src) {
              observer.disconnect();
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
            observer.disconnect();
            resolve(src);
          }
        });

        return videoSrc || '';

      } else {
        return ''
      }
    } catch (error) {
      console.error('错误:', error);
      return ''; // 错误时返回空字符串
    }
  }





  // 获取详情页图片（优化后）
  const handleDetailImages = async (maxRetries = 3, retryCount = 0) => {
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
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待 1 秒，确保页面加载完成
      elements = getImageElements();
      extractImageUrls(elements);
    }

    const check = checkForInvalidUrls();
    if (check && retryCount < maxRetries) {
      // 如果存在未成功获取的 URL，并且未达到最大递归次数，则递归调用
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待 1 秒，确保页面加载完成
      return handleDetailImages(maxRetries, retryCount + 1);
    }

    return rst;
  };




  // 数据汇总
  const processTaobaoData = async (isSku: boolean, isMainVideo: boolean, isMainImages: boolean, isDetailImages: boolean): Promise<Result> => {
    const result: Result = {}

    const title = handleTitle()
    if (title) {
      result['title'] = title
    }

    if (isSku) {
      const skus = await handleSkus()
      if (skus) {
        result['skus'] = skus
      }
    }

    if (isMainVideo) {
      const mainVideoUrl = await handleMainVideo()
      if (mainVideoUrl) {
        result['mainVideoUrl'] = mainVideoUrl
      }
    }

    if (isMainImages) {
      const mainImages = handleMainImages()
      if (mainImages) {
        result['mainImages'] = mainImages
      }
    }

    if (isDetailImages) {
      const detailImages = await handleDetailImages()
      if (detailImages) {
        result['detailImages'] = detailImages
      }
    }

    return result
  }


  return {
    handleTaobaoTitle: handleTitle,
    processTaobaoData
  }
}