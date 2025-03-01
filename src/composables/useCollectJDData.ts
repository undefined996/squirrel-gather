import { Result, Sku } from "~/types";



export function useCollectJDData() {
  // 获取标题信息
  const handleTitle = (): string => {
    const parentElement = document.querySelector('.sku-name-title');
    return (parentElement?.textContent?.trim() || '').replace(/\_/, '_')
  };


  // 获取sku名称及图片信息
  const handleSkus = () => {

    const rst: Sku[] = [];

    const elements = document.querySelectorAll('#choose-attrs .dd a')
    if (elements.length > 0) {
      elements.forEach(element => {
        const imgSrc = element.querySelector("img")?.getAttribute('src')
        const label = element.querySelector("i")?.textContent
        if (imgSrc && label) {
          const rightSizeImgSrc = imgSrc.replace(/\/s28x28_jfs\//, '/s720x720_jfs/').replace('img14.360buyimg.com', 'img10.360buyimg.com')
          rst.push({
            label: label.replace(/\//g, '_'),
            url: rightSizeImgSrc.startsWith('//') ? `${window.location.protocol}${rightSizeImgSrc}` : rightSizeImgSrc,
          });
        }
      })
    }

    return rst
  }


  // 获取主图
  const handleMainImages = (): string[] => {
    const imgElements = document.querySelectorAll("#spec-list .lh li img");
    return Array.from(imgElements)
      .map((element) => element.getAttribute('src'))
      .filter((url): url is string => url !== null)
      .map((url) => {

        const rightSizeImgSrc = url.replace(/\/s114x114_jfs\//, '/s720x720_jfs/')
        return rightSizeImgSrc.startsWith('//') ? `${window.location.protocol}${rightSizeImgSrc}` : rightSizeImgSrc
      })
  };


  // 检查元素是否在视口中
  const isInViewport = (element: any) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // 获取主图视频地址
  const handleMainVideo = (): Promise<string> => {
    return new Promise((resolve) => {
      try {
        // 常量定义
        const VIDEO_ICON_SELECTOR = '.video-play-icon';
        const VIDEO_ELEMENT_SELECTOR = '#video-player_html5_api';
        const TIMEOUT_DURATION = 2000; // 超时时间

        // 查找 .video-play-icon 元素
        const videoPlayIcon = document.querySelector(VIDEO_ICON_SELECTOR);
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

        // 创建并触发 mouseover 事件到兄弟节点
        const mouseOverEventSibling = new MouseEvent('mouseover', {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        siblingElement.dispatchEvent(mouseOverEventSibling);

        // 创建并触发 mouseover 事件到父节点
        const mouseOverEventParent = new MouseEvent('mouseover', {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        parentElement.dispatchEvent(mouseOverEventParent);

        // 设置 MutationObserver 监听视频元素
        const observer = new MutationObserver(() => {
          const videoElement = document.querySelector(VIDEO_ELEMENT_SELECTOR);
          if (videoElement) {
            const videoSrc = videoElement.getAttribute('src');
            resolve(videoSrc || '');
            observer.disconnect(); // 停止观察
            if (timeoutId) clearTimeout(timeoutId); // 清除超时
          }
        });

        // 开始观察文档的变化
        observer.observe(document.body, { childList: true, subtree: true });

        // 设置超时处理
        const timeoutId = setTimeout(() => {
          resolve('');
          observer.disconnect(); // 停止观察
        }, TIMEOUT_DURATION);
      } catch (error) {
        console.error('处理主图视频地址时发生错误:', error);
        resolve('');
      }
    });
  };


  // 获取详情页图片（优化后）
  const handleDetailImages = () => {
    // 基于正则表达式提取图片地址
    const getImageSrcByRegex = () => {
      const element = document.querySelector('#J-detail-content style');
      const cssContent = element?.textContent;

      if (cssContent) {
        // 正则表达式匹配 background-image: url(...)
        const regex = /background-image:\s*url\(([^)]+)\)/g;

        // 使用 match 方法一次性匹配所有 URL
        const matches = cssContent.match(regex);

        return matches
          ? matches
            .map(match => match.replace(/background-image:\s*url\(([^)]+)\)/, '$1'))
            .map(match => (match.startsWith('//') ? `${window.location.protocol}${match}` : match))
          : [];
      }
      return [];
    };

    // 基于DOM提取图片地址
    const getImageSrcByDom = () => {
      const result: any = [];
      // 情况2：dom直接提取
      const elements = document.querySelectorAll('#J-detail-content p img');
      elements.forEach(element => {
        const imageSrc = element.getAttribute('src');
        if (imageSrc) {
          result.push(imageSrc.startsWith('//') ? `${window.location.protocol}${imageSrc}` : imageSrc);
        }
      });
      return result;
    };

    const regexHandleResult = getImageSrcByRegex();
    console.log('regexHandleResult==============>', regexHandleResult)
    const domHandleResult = getImageSrcByDom();
    console.log('domHandleResult==============>', domHandleResult)

    return [...regexHandleResult, ...domHandleResult];
  };


  // 数据汇总
  const processJDData = async (isSku: boolean, isMainVideo: boolean, isMainImages: boolean, isDetailImages: boolean): Promise<Result> => {
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
    processJDData
  }
}