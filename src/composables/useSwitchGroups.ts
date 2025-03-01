import { Settings } from "~/types";

export function useSwitchGroups(settings: Settings) {

  const switchGroups = [
    {
      name: '功能设定',
      children: [
        {
          name: '生成源链接文件',
          status: settings.isReadMe
        }
      ]
    },
    {
      name: '资源下载选项',
      children: [
        {
          name: '主图视频',
          status: settings.isMainVideo
        },
        {
          name: '主图图片',
          status: settings.isMainImages
        },
        {
          name: 'SKU名称及图片',
          status: settings.isSkus
        },
        {
          name: '详情页图片',
          status: settings.isDetailImages
        },
        {
          name: '讲解/详情视频',
          status: settings.isDetailVideo
        }
      ]
    }
  ];

  return {
    switchGroups
  };
}