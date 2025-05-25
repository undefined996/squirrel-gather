
// 域名配置
export enum Hostname {
  // 1688域名
  ALI = 'detail.1688.com',
  // 天猫域名
  TMALL = 'detail.tmall.com',
  // 淘宝域名
  TAOBAO = 'item.taobao.com',
  // 京东域名
  JD = 'item.jd.com'
}

// 消息提示
export enum NotificationMessage {
  STARTING = '开始解析页面数据',
  SUBMITTING = '解析成功已提交后台处理',
  PACKAGING = '资源提取成功正打包压缩',
  DOWNLOAD_COMPLETED = '下载成功请默认下载目录查验',
  ERROR = '任务执行失败请重试',
  BACKGROUND_ERROR = '处理器出现异常',
  CONTROLLER_ERROR = '控制器出现异常'
}


// 定义原生的消息通道
export const NATIVE_STATE_UPDATE_CHANNEL = "state-update"