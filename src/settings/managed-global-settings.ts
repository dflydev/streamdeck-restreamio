import {
  RestreamioAccount,
  RestreamioAccountCollection,
  RestreamioAccountId,
  RestreamioStreamingPlatform,
  RestreamioStreamingPlatformId,
} from '../restreamio/types'
import {SettingsManager} from 'streamdeck-typescript'
import {createEmptyGlobalSettings, GlobalSettings} from './global-settings'

export class ManagedGlobalSettings implements GlobalSettings {
  private settingsManager: SettingsManager

  get rawGlobalSettings(): GlobalSettings {
    const rawGlobalSettings = this.settingsManager.getGlobalSettings<GlobalSettings>() as GlobalSettings

    if (!rawGlobalSettings) {
      return createEmptyGlobalSettings()
    }

    return rawGlobalSettings
  }

  get restreamioAccounts(): RestreamioAccountCollection {
    return this.rawGlobalSettings.restreamioAccounts
  }

  get restreamioStreamingPlatforms(): RestreamioStreamingPlatform[] {
    return this.rawGlobalSettings.restreamioStreamingPlatforms
  }

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager
  }

  setRestreamioStreamingPlatforms(
    restreamioStreamingPlatforms: RestreamioStreamingPlatform[],
  ): void {
    this.settingsManager.setGlobalSettingsAttributes({
      restreamioStreamingPlatforms,
    })
  }

  registerRestreamioAccount(
    restreamioAccount: RestreamioAccount,
  ): RestreamioAccountId {
    this.settingsManager.setGlobalSettings({
      ...this.rawGlobalSettings,
      restreamioAccounts: {
        ...this.rawGlobalSettings.restreamioAccounts,
        [restreamioAccount.profile.id]: restreamioAccount,
      },
    })

    return restreamioAccount.profile.id
  }

  getRestreamioAccounts(): RestreamioAccount[] {
    if (!this.rawGlobalSettings.restreamioAccounts) {
      return []
    }

    return Object.keys(this.rawGlobalSettings.restreamioAccounts).map(
      k => this.rawGlobalSettings.restreamioAccounts[k],
    )
  }

  getRestreamioStreamingPlatformById(
    restreamStreamingPlatformId: RestreamioStreamingPlatformId,
  ): RestreamioStreamingPlatform | undefined {
    return this.rawGlobalSettings.restreamioStreamingPlatforms.find(
      platform => platform.id === restreamStreamingPlatformId,
    )
  }
}
