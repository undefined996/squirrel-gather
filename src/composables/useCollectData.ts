import pLimit from "p-limit";
import { PlatformHandler, Result, Settings, SettingsHandler, TaskType } from "~/types";

export function useCollectData(
  handler: PlatformHandler,
  settingsHandlers: SettingsHandler<any>[],
  url: string
) {
  // 顺序任务、并发任务分发及执行
  const executeTasks = async (
    settingsHandlers: SettingsHandler<any>[],
    settings: Settings,
    result: Result,
    limit: (fn: () => Promise<void>) => Promise<void>
  ): Promise<void> => {
    // 任务队列
    const sequentialTasks: (() => Promise<void>)[] = [];
    const concurrentTasks: Promise<void>[] = [];

    // 动态添加任务
    settingsHandlers.forEach(({ key, handler, resultKey, defaultValue, taskType }) => {
      if (settings[key].value) {
        const task = async () => {
          const value = await handler();
          result[resultKey] = value ?? defaultValue;
        };

        if (taskType === TaskType.SEQUENTIAL) {
          sequentialTasks.push(task); // 顺序任务
        } else {
          concurrentTasks.push(limit(task)); // 并发任务，限制并发数
        }
      }
    });

    // 执行任务
    try {
      // 按顺序执行顺序任务
      for (const task of sequentialTasks) {
        await task();
      }

      // 并发执行并发任务
      await Promise.all(concurrentTasks);
    } catch (error) {
      console.error('任务执行过程中发生错误:', error);
      throw new Error('任务执行失败');
    }
  };


  // 计算出最合适的并发数，充分发挥系统性能
  const computeLimit = (min = 1, max = 5): number => {
    let concurrentCount = 0;
    let hasSequentialTask = false;

    if (settingsHandlers.length <= 0) return min; // 兜底最小值为 1

    settingsHandlers.forEach(handler => {
      if (handler.taskType === TaskType.CONCURRENT) {
        concurrentCount++;
      } else if (handler.taskType === TaskType.SEQUENTIAL) {
        hasSequentialTask = true; // 标记是否存在顺序任务
      }
    });

    // 兜底最小值为 1，避免返回 0
    const limit = concurrentCount + (hasSequentialTask ? 1 : 0);
    return Math.min(Math.max(limit, min), max);
  };

  // 数据汇总
  const processData = async (settings: Settings): Promise<Result> => {
    const result: Result = { url }; // 初始化 result 并添加 url
    const n = computeLimit() // 计算并发数
    const limit = pLimit(n); // 设置最大并发数

    // 处理标题
    result.title = await handler.handleTitle() ?? '';

    // 执行任务
    await executeTasks(settingsHandlers, settings, result, limit);

    // 处理 isReadMe
    result.isReadMe = settings.isReadMe.value;

    return result;
  };

  return {
    processData,
  };
}