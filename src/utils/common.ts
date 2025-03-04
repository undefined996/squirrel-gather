import { NotificationOptions } from '~/types';

// 延迟异步函数
export const delay = (ms: number): Promise<void> => {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}


// 获取URL地址
export const getPageUrl = (): string => {
  return window.location.href
}


// chrome通知
export const showNotification = ({ title, message }: NotificationOptions): void => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/assets/icon-48.png',
    title,
    message,
    priority: 2,
  });
}

// 数值转字符串
export const formatNumber = (num: number, length: number): string => {
  return num.toString().padStart(length, '0');
};


// 去掉指定符号后面的字符串
export const removeDashAndAfter = (str: string, dash: string = '-') => {
  const dashIndex = str.indexOf(dash)
  // 如果找到 "-"，则截取 "-" 之前的部分
  if (dashIndex !== -1) {
    return str.slice(0, dashIndex).trim(); // 使用 trim() 去掉可能的空格
  }
  // 如果没有 "-"，返回原字符串
  return str
}


// URL补全URL协议头
export const completeUrlProtocol = (url: string): string => {
  return url.startsWith('//') ? `${window.location.protocol}${url}` : url
}


// 文本信息去除“/”，如果存在会影响文件保存：如果存在会当成文件夹处理
export const normalizeText = (text: string, reg: RegExp = /\//g): string => {
  return text.replace(reg, '_').trim()
}


// 判断元素是否在视口中
// 检查元素是否在视口中
export const isInViewport = (element: any) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}