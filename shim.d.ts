import type { ProtocolWithReturn } from 'webext-bridge'
import { RequestData, AgentRequestData, ResponseData, SimpleStatus } from '~/types/schemas'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    'download-resources': RequestData,
    'start-agent': AgentRequestData,
    // 'stop-agent': ProtocolWithReturn<{ controllerStatus: SimpleStatus }, ResponseData>,
    'agent-param-sync': AgentRequestData
  }
}
