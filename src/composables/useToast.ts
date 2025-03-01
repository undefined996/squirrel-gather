import { toast } from 'vue-sonner';
import { NotificationMessage } from '~/constants';
import { ToastOptions, ToastType } from '~/types';


/**
 * 显示 Toast 弹窗的 Hook
 * @returns {Object} - 包含 showToast 方法的对象
 */
export function useToast(style: string) {
  /**
   * 显示 Toast 弹窗
   * @param {NotificationMessage} notificationMessageValue - 提示消息内容
   * @param {ToastType} type - Toast 类型，默认为 'info'
   * @param {ToastOptions} options - 其他配置项
   */
  const showToast = (
    notificationMessageValue: NotificationMessage,
    type: ToastType = 'info',
    options: ToastOptions = {}
  ): void => {
    const { closeButton = false, duration = 5000 } = options;

    // Toast 配置
    const toastConfig = {
      class: style,
      duration,
      closeButton,
    };

    console.log('current toastConfig=====>', toastConfig)

    // 根据类型调用对应的 toast 方法
    const toastMethods = {
      info: toast.info,
      success: toast.success,
      error: toast.error,
      warning: toast.warning
    };

    toastMethods[type](notificationMessageValue, toastConfig);
  };

  return {
    showToast,
  };
}