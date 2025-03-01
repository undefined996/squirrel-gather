import { NotificationOptions } from '~/types';

// 延迟异步函数
export function delay(ms: number): Promise<void> {
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