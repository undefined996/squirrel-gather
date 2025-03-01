import { removeDashAndAfter } from '~/utils/common';
import { Sku, Result, Settings } from '../types'

// 1688视图筛选器统一配置
const ALI_SELECTORS = {
  titleContent: '.title-content',
  headTitleContent: 'head title',
  skuFilterButton: '.sku-filter-button.v-flex',
  skuImageWrap: '.ant-image.v-image-wrap.item-image-icon',
  mainVideo: 'video.lib-video',
  mainImage: 'img.od-gallery-img',
  detailVideo: 'video.detail-video',
  htmlDescription: '.html-description',
  detail: '#detail',
};


export function useCollectAliData(url: string) {
  // 获取1688标题
  const handleTitle = (): string => {
    // const element = document.querySelector(ALI_SELECTORS.titleContent)
    // if (element) {
    //   const h1 = element.querySelector('h1')
    //   if (h1) {
    //     return h1.textContent || ''
    //   }
    // }
    // return ''


    const headTitleElement = document.querySelector(ALI_SELECTORS.headTitleContent);
    const headTitleTextContent = headTitleElement?.textContent;
    if (!headTitleElement || !headTitleTextContent) {
      return ''; // 如果没有找到 head 标题元素或标题内容为空，直接返回空字符串
    }

    // 获取 head 标题内容并处理
    const processedTitle = removeDashAndAfter(headTitleTextContent, '-') // 去掉 "-" 及后面的部分
      .replace(/\//g, '_') // 替换所有斜杠为下划线
      .trim(); // 去掉前后空格

    return processedTitle || '';
  }


  // 获取1688 sku信息
  const handleSkus = (): Sku[] => {
    const rst: Sku[] = []

    const processElements = (elements: NodeListOf<Element>, getImageUrl: boolean) => {
      elements.forEach((element) => {
        const labelEle = getImageUrl ? element.nextElementSibling : element.querySelector('.label-name');
        const imgEle = element.querySelector('.ant-image-img');

        const skuInfo: Sku = {
          label: labelEle ? labelEle.textContent?.replace(/\//g, '_') || null : null,
          url: imgEle ? imgEle.getAttribute('src') || null : null,
        };

        if (skuInfo.label && skuInfo.url) {
          skuInfo.url = skuInfo.url.startsWith('//') ? window.location.protocol + skuInfo.url : skuInfo.url;
          rst.push(skuInfo);
        }
      });
    };

    // 类型1
    const elements1 = document.querySelectorAll(ALI_SELECTORS.skuFilterButton);
    if (elements1.length > 0) {
      processElements(elements1, false);
    }

    // 类型2
    const elements2 = document.querySelectorAll(ALI_SELECTORS.skuImageWrap);
    if (elements2.length > 0) {
      processElements(elements2, true);
    }

    return rst
  }

  // 获取1688主图视频
  const handleMainVideo = (): string => {
    const videoElement = document.querySelector<HTMLVideoElement>(ALI_SELECTORS.mainVideo);
    if (videoElement) {
      const url = videoElement.getAttribute('src');
      if (url) {
        return url.startsWith('//') ? `${window.location.protocol}${url}` : url;
      }
    }
    return '';
  };

  // 获取1688主图
  const handleMainImages = (): string[] => {
    const rst: string[] = [];
    const elements = document.querySelectorAll<HTMLImageElement>(ALI_SELECTORS.mainImage);

    elements.forEach((element) => {
      const url = element.getAttribute('src');
      if (url) {
        const processedUrl = url.endsWith('.jpg_b.jpg') ? url.replace(/\.jpg_b\.jpg$/, '.jpg_.webp') : url;
        rst.push(processedUrl.startsWith('//') ? `${window.location.protocol}${processedUrl}` : processedUrl);
      }
    });

    return rst;
  };

  // 获取1688详情页视频
  const handleDetailVideo = (): string => {
    const videoElement = document.querySelector<HTMLVideoElement>(ALI_SELECTORS.detailVideo);
    if (videoElement) {
      const url = videoElement.getAttribute('src');
      if (url) {
        return url.startsWith('//') ? `${window.location.protocol}${url}` : url;
      }
    }
    return '';
  };

  // 获取1688详情图片
  const handleDetailImages = (): string[] => {
    const rst: string[] = [];
    const htmlDescriptionElement = document.querySelector(ALI_SELECTORS.htmlDescription);

    if (!htmlDescriptionElement) return rst;

    const shadowRoot = htmlDescriptionElement.shadowRoot;
    if (!shadowRoot) return rst;

    const detailElement = shadowRoot.querySelector(ALI_SELECTORS.detail);
    if (!detailElement) return rst;

    const imgElements = detailElement.querySelectorAll<HTMLImageElement>('img');
    imgElements.forEach((element) => {
      const url = element.getAttribute('src');
      if (url) {
        rst.push(url.startsWith('//') ? `${window.location.protocol}${url}` : url);
      }
    });

    return rst;
  };


  // 数据汇总
  const processAliData = (settings: Settings): Result => {
    const result: Result = {}

    const title = handleTitle()
    if (title) {
      result['title'] = title
    }

    if (settings.isSkus.value) {
      const skus = handleSkus()
      if (skus) {
        result['skus'] = skus
      }
    }

    if (settings.isMainVideo.value) {
      const mainVideoUrl = handleMainVideo()
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
      const detailImages = handleDetailImages()
      if (detailImages) {
        result['detailImages'] = detailImages
      }
    }
    if (settings.isDetailVideo.value) {
      const detailVideoUrl = handleDetailVideo()
      if (detailVideoUrl) {
        result['detailVideoUrl'] = detailVideoUrl
      }
    }

    if (settings.isReadMe.value) {
      result['isReadMe'] = true
    }

    result['url'] = url

    return result
  }


  return {
    processAliData
  }
}