import { Sku, Result, Settings } from '../types'
import { delay, getPageUrl, removeDashAndAfter } from '../utils/common'


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



export function useCollectTmallData(url: string) {


  // 获取标题信息
  // 天猫标题scroll后会消失，改为从head.title中获取标题，head标题需要解析处理
  const handleTitle = (): string => {

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
    const processedTitle = removeDashAndAfter(headTitleTextContent, '-') // 去掉 "-" 及后面的部分
      .replace(/\//g, '_') // 替换所有斜杠为下划线
      .trim(); // 去掉前后空格

    return processedTitle || '';
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

    let elements = document.querySelectorAll(TMALL_SELECTORS.skuFilter);
    if (elements.length > 0) {
      await loadImages(elements);
    }

    elements = document.querySelectorAll(TMALL_SELECTORS.skuFilter);
    if (elements.length > 0) {
      extractSkuInfo(elements);
    }

    return rst;
  }


  // 获取主图
  const handleMainImages = (): string[] => {
    const imgElements = document.querySelectorAll(TMALL_SELECTORS.mainImage);
    return Array.from(imgElements)
      .map((element) => element.getAttribute('src'))
      .filter((url): url is string => url !== null)
      .map((url) => (url.startsWith('//') ? `${window.location.protocol}${url}` : url));
  };

  // 获取主图视频
  const handleMainVideo = async (): Promise<string> => {
    const TIMEOUT_DURATION = 3000; // 3秒超时

    try {
      const baseElement = document.querySelector('div[class*="switchTabsWrap"][data-appeared="true"]');
      if (!baseElement) {
        return '';
      }

      const getVideoSrc = (): string | null => {
        const videoElement = document.querySelector(TMALL_SELECTORS.mainVideo);
        const src = videoElement?.getAttribute('src')?.trim() || null;
        return src ? (src.startsWith('//') ? `${window.location.protocol}${src}` : src) : null;
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
  };


  // 自动滚动
  // const scrollToBottom = async () => {
  //   return new Promise<void>(function (resolve, reject) {
  //     const totalHeight = document.body.scrollHeight;
  //     const increment = 100;
  //     let scrolled = window.scrollY;

  //     // 定义目标选择器
  //     const targetLastDetailImageSelector = 'img[src="//img.alicdn.com/imgextra/i3/O1CN01MsWlBa29wVnysxUvn_!!6000000008132-2-tps-750-880.png"]';
  //     const targetStoreRecommendSelector = '[class*="RecommendInfo"][data-spm="recommends"]';
  //     const targetWatchAgainSelector = '.tb-pick-feeds-container';

  //     // 使用 IntersectionObserver 检测元素是否进入视口
  //     const observer = new IntersectionObserver(function (entries, observer) {
  //       entries.forEach(function (entry) {
  //         // 检查是否为需要终止滚动的元素
  //         if (entry.isIntersecting) {
  //           observer.disconnect(); // 停止监听
  //           mutationObserver.disconnect(); // 停止 DOM 变化监听
  //           resolve(); // 元素已进入视口，结束滚动
  //         }
  //       });
  //     }, { threshold: 0.1 }); // 当目标元素 10% 进入视口时触发

  //     // 使用 MutationObserver 动态监听 DOM 变化，确保在元素加载后开始观察
  //     const mutationObserver = new MutationObserver((mutations) => {
  //       mutations.forEach(() => {
  //         try {
  //           // 监听多个元素
  //           const targetLastDetailImageElement = document.querySelector(targetLastDetailImageSelector);
  //           const targetStoreRecommendElement = document.querySelector(targetStoreRecommendSelector);
  //           const targetWatchAgainElement = document.querySelector(targetWatchAgainSelector);

  //           if (targetLastDetailImageElement) observer.observe(targetLastDetailImageElement);
  //           if (targetStoreRecommendElement) observer.observe(targetStoreRecommendElement);
  //           if (targetWatchAgainElement) observer.observe(targetWatchAgainElement);
  //         } catch (error) {
  //           console.error('Error observing targets:', error);
  //           reject(error);
  //         }
  //       });
  //     });

  //     // 启动 MutationObserver 监听 DOM 变化
  //     mutationObserver.observe(document.body, { childList: true, subtree: true });

  //     // 滚动到页面底部
  //     const scroll = function () {
  //       scrolled += increment;
  //       if (scrolled < totalHeight) {
  //         window.scrollTo({
  //           top: scrolled,
  //           behavior: 'smooth'
  //         });

  //         // 延迟 30ms 再滚动以降低滚动速度
  //         setTimeout(function () {
  //           requestAnimationFrame(scroll); // 使用 requestAnimationFrame 实现平滑滚动
  //         }, 60); // 延迟 30ms 以减缓滚动速度，提供更平滑的视觉效果
  //       } else {
  //         window.scrollTo({
  //           top: totalHeight,
  //           behavior: 'smooth'
  //         });
  //         resolve(); // 滚动完成后解析 Promise
  //       }
  //     };

  //     // 每次滚动后检查是否需要停止
  //     const checkTargetVisibility = function () {
  //       try {
  //         const targetLastDetailImageElement = document.querySelector(targetLastDetailImageSelector);
  //         const targetStoreRecommendElement = document.querySelector(targetStoreRecommendSelector);
  //         const targetWatchAgainElement = document.querySelector(targetWatchAgainSelector);

  //         if (
  //           (targetLastDetailImageElement && targetLastDetailImageElement.getBoundingClientRect().top < window.innerHeight) ||
  //           (targetStoreRecommendElement && targetStoreRecommendElement.getBoundingClientRect().top < window.innerHeight) ||
  //           (targetWatchAgainElement && targetWatchAgainElement.getBoundingClientRect().top < window.innerHeight)
  //         ) {
  //           resolve(); // 如果目标元素进入视口，停止滚动
  //         }
  //       } catch (error) {
  //         console.error('出现错误', error);
  //         reject(error);
  //       }
  //     };

  //     // 每次滚动后检查是否需要停止
  //     const scrollWithCheck = function () {
  //       scroll(); // 执行滚动
  //       checkTargetVisibility(); // 检查目标元素是否进入视口
  //     };

  //     scrollWithCheck(); // 开始滚动
  //   });
  // };



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
      await delay(1000); // 等待 1 秒，确保页面加载完成
      elements = getImageElements();
      extractImageUrls(elements);
    }

    const check = checkForInvalidUrls();
    if (check && retryCount < maxRetries) {
      // 如果存在未成功获取的 URL，并且未达到最大递归次数，则递归调用
      await delay(1000); // 等待 1 秒，确保页面加载完成
      return handleDetailImages(maxRetries, retryCount + 1);
    }

    // window.scrollTo({
    //   top: 0,
    //   behavior: 'smooth'
    // });

    return rst;
  };


  // 获取详情页图片地址
  // const handleDetailImages = async () => {
  //   const rst: string[] = [];

  //   await scrollToBottom();

  //   const processImages = (selector: string, excludeUrl: string) => {
  //     const imageElements = document.querySelectorAll(selector);

  //     imageElements.forEach((ele) => {
  //       const src = ele.getAttribute('src');
  //       const dataSrc = ele.getAttribute('data-src');
  //       const url = src !== '//g.alicdn.com/s.gif' ? src : dataSrc;

  //       if (url && !url.includes(excludeUrl)) {
  //         rst.push(url.startsWith('//') ? window.location.protocol + url : url);
  //       }
  //     });
  //   };

  //   // 处理第一类图片
  //   processImages(TMALL_SELECTORS.detailImageFilter1, TMALL_SELECTORS.invalidDetailImageKeyInfo);

  //   // 处理第二类图片
  //   processImages(TMALL_SELECTORS.detailImageFilter2, TMALL_SELECTORS.invalidDetailImageKeyInfo);

  //   return rst;
  // };


  // 数据汇总
  const processTmallData = async (settings: Settings): Promise<Result> => {
    const result: Result = {}

    const title = handleTitle()
    if (title) {
      result['title'] = title
    }

    if (settings.isSkus.value) {
      const skus = await handleSkus()
      if (skus) {
        result['skus'] = skus
      }
    }

    if (settings.isMainVideo.value) {
      const mainVideoUrl = await handleMainVideo()
      if (mainVideoUrl) {
        result['mainVideoUrl'] = mainVideoUrl
      }
    }

    if (settings.isMainImages.value) {
      const mainImages = handleMainImages()
      if (mainImages) {
        result['mainImages'] = mainImages
      }
    }

    if (settings.isDetailImages.value) {
      const detailImages = await handleDetailImages()
      if (detailImages) {
        result['detailImages'] = detailImages
      }
    }

    if (settings.isReadMe.value) {
      result['isReadMe'] = true
    }

    result['url'] = url

    return result
  }


  return {
    processTmallData
  }
}