import {RestreamioAccountId, RestreamioChannelId} from '../restreamio/types'

export function createEmptySettings(): Settings {
  return new (class implements Settings {
    restreamioAccountId: null
    restreamioChannelId: null
    name: null
    platform: null
  })()
}

export interface Settings {
  restreamioAccountId: RestreamioAccountId | null
  restreamioChannelId: RestreamioChannelId | null
  name: string | null
  platform: string | null
}
