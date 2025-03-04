// sku信息
export interface Sku {
  label: string | null
  url: string | null
}

// 消息发送结构体定义
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray
  | { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// 网页（content)解析结果
export interface Result {
  title?: string
  skus?: Sku[]
  mainVideoUrl?: string
  mainImages?: string[]
  detailImages?: string[]
  detailVideoUrl?: string
  isReadMe?: boolean
  url?: string,
  [key: string]: JsonValue | undefined | Sku[]; // 添加索引签名
}

// 通知
export interface NotificationOptions {
  title: string;
  message: string;
};


// 设置选项
export interface Item {
  id?: string
  name: string
  status?: boolean
}

// 可交互按钮类型属性
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
  isDetailVideo: Ref<boolean>,
  [key: string]: Ref<boolean>; // 添加索引签名
}


// 任务类型
export enum TaskType {
  // 可并发执行
  CONCURRENT = "可并发执行",
  // 需顺序执行
  SEQUENTIAL = "需顺序执行"
}

// 设置项处理函数
export interface SettingsHandler<T> {
  key: keyof Settings; // settings 的字段名
  handler: () => Promise<T> | T; // 处理函数
  resultKey: keyof Result; // 使用 keyof 确保 resultKey 是 Result 的合法字段
  defaultValue: T; // 根据 resultKey 的类型定义默认值
  taskType: TaskType
}


// Toast 类型
export type ToastType = 'info' | 'success' | 'error' | 'warning';

// Toast 配置
export interface ToastOptions {
  closeButton?: boolean; // 是否显示关闭按钮
  duration?: number;     // 显示时长
}


// 页面内容解析handle统一接口
export interface PlatformHandler {
  handleTitle: () => Promise<string>;
  handleSkus: () => Promise<Sku[]>;
  handleMainImages: () => Promise<string[]>;
  handleMainVideo: () => Promise<string>;
  handleDetailImages: () => Promise<string[]>;
  handleDetailVideo?: () => Promise<string>;
}

// 响应结构体
export interface Response extends JsonObject {
  code: number;
  message: string;
  data: JsonValue;
  source: 'background' | 'content' | 'popup' | 'sidepanel';
  status: 'success' | 'failed' | 'unknown';
  [key: string]: JsonValue; // 添加索引签名并确保符合 JsonValue 类型
}