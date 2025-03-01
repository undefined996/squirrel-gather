
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
  PARSING = '开始解析页面数据',
  COMMITTING = '解析成功已通知后台处理',
  PACKAGING = '资源提取成功正打包压缩',
  DOWNLOADING = '下载成功请默认下载目录查验',
  ERROR = '资源下载失败请重试'
}

