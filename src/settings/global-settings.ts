import {
  RestreamioAccountCollection,
  RestreamioStreamingPlatform,
} from '../restreamio/types'

export function createEmptyGlobalSettings(): GlobalSettings {
  return {
    restreamioAccounts: {},
    restreamioStreamingPlatforms: [],
  }
}

export interface GlobalSettings {
  restreamioAccounts: RestreamioAccountCollection
  restreamioStreamingPlatforms: RestreamioStreamingPlatform[]
}
