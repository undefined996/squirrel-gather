import { completeUrlProtocol, normalizeText, removeDashAndAfter } from '~/utils/common';
import { Sku, PlatformHandler, SettingsHandler, TaskType } from '../types/schemas'
import { useCollectData } from './useCollectData';

// 1688视图筛选器统一配置
export const ALI_SELECTORS = {
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


const aliHandlers: PlatformHandler = {

  // 获取1688标题
  handleTitle: async (): Promise<string> => {
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
    const processedTitle = normalizeText(removeDashAndAfter(headTitleTextContent, '-'))

    return processedTitle || '';
  },


  // 获取1688 sku信息
  handleSkus: async (): Promise<Sku[]> => {
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
          const imageUrl = completeUrlProtocol(skuInfo.url);
          skuInfo.url = imageUrl.replace('\.jpg_sum\.jpg', '.jpg').trim();
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
  },



  // 获取1688主图视频
  handleMainVideo: async (): Promise<string> => {
    const videoElement = document.querySelector<HTMLVideoElement>(ALI_SELECTORS.mainVideo);
    if (videoElement) {
      const url = videoElement.getAttribute('src');
      if (url) {
        return completeUrlProtocol(url);
      }
    }
    return '';
  },


  // 获取1688主图
  handleMainImages: async (): Promise<string[]> => {
    const rst: string[] = [];
    const elements = document.querySelectorAll<HTMLImageElement>(ALI_SELECTORS.mainImage);

    elements.forEach((element) => {
      const url = element.getAttribute('src');
      if (url) {
        const processedUrl = url.endsWith('.jpg_b.jpg') ? url.replace(/\.jpg_b\.jpg$/, '.jpg_.webp') : url;
        rst.push(completeUrlProtocol(processedUrl));
      }
    });

    return rst;
  },


  // 获取1688详情页视频
  handleDetailVideo: async (): Promise<string> => {
    const videoElement = document.querySelector<HTMLVideoElement>(ALI_SELECTORS.detailVideo);
    if (videoElement) {
      const url = videoElement.getAttribute('src');
      if (url) {
        return completeUrlProtocol(url);
      }
    }
    return '';
  },



  // 获取1688详情图片
  handleDetailImages: async (): Promise<string[]> => {
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
        if (!/\.\d+x\d+/.test(url)) {
          rst.push(completeUrlProtocol(url).split('?')[0]);
        }

      }
    });

    return rst;
  }
}

// 定义阿里的settingsHandlers
const aliSettingsHandlers: SettingsHandler<any>[] = [
  { key: 'isSkus', handler: aliHandlers.handleSkus, resultKey: 'skus', defaultValue: [], taskType: TaskType.CONCURRENT },
  { key: 'isMainVideo', handler: aliHandlers.handleMainVideo, resultKey: 'mainVideoUrl', defaultValue: '', taskType: TaskType.CONCURRENT },
  { key: 'isMainImages', handler: aliHandlers.handleMainImages, resultKey: 'mainImages', defaultValue: [], taskType: TaskType.CONCURRENT },
  { key: 'isDetailImages', handler: aliHandlers.handleDetailImages, resultKey: 'detailImages', defaultValue: [], taskType: TaskType.CONCURRENT },
];


export function useCollectAliData(url: string) {
  return useCollectData(aliHandlers, aliSettingsHandlers, url);
}