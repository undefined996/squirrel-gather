import { ResponseData, SimpleStatus } from '~/types/schemas'

export enum NativeMessageType {
  JOB_STATE_NOTIFY = 'job-state-notify',
  START_AGENT = 'start-agent'
}

export interface NativeMessageMap {
  [NativeMessageType.JOB_STATE_NOTIFY]: ResponseData,
  [NativeMessageType.START_AGENT]: {
    sourceId: number | undefined,
    status: SimpleStatus
  }
}