/**
 * sku信息
 */
export interface Sku {
  label: string | null
  url: string | null
}

/**
 * 网页（content)解析结果
 */
export interface Result {
  title?: string
  skus?: Sku[]
  mainVideoUrl?: string
  mainImages?: string[]
  detailImages?: string[]
  detailVideoUrl?: string
  isReadMe?: boolean
  url?: string
}

/**
 * 消息发送结构体定义
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

/**
 * 通知
 */
export interface NotificationOptions {
  title: string;
  message: string;
};


/**
 * 设置选项
 */
export interface Item {
  id?: string
  name: string
  status?: boolean
}

/**
 * 可交互按钮类型属性
 */
export interface ActionButtonProps {
  label: string
  isExpand: boolean
  isHiddenTooltip: boolean
}

// 设置面板选项
export interface Settings {
  isReadMe: Ref<boolean>
  isMainVideo: Ref<boolean>
  isMainImages: Ref<boolean>
  isSkus: Ref<boolean>
  isDetailImages: Ref<boolean>
  isDetailVideo: Ref<boolean>
}


// Toast 类型
export type ToastType = 'info' | 'success' | 'error' | 'warning';

// Toast 配置
export interface ToastOptions {
  closeButton?: boolean; // 是否显示关闭按钮
  duration?: number;     // 显示时长
}