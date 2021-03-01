import {RestreamioAccountId, RestreamioChannelId} from '../restreamio/types'
import {SettingsManager} from 'streamdeck-typescript'
import {createEmptySettings, Settings} from './settings'

export class ManagedSettings implements Settings {
  private context: string
  private settingsManager: SettingsManager

  private get rawSettings(): Settings {
    const rawSettings = this.settingsManager.getContextSettings<Settings>(
      this.context,
    )

    if (!rawSettings) {
      return createEmptySettings()
    }

    return rawSettings
  }

  get restreamioAccountId(): RestreamioAccountId | null {
    return this.rawSettings.restreamioAccountId
  }

  get restreamioChannelId(): RestreamioChannelId | null {
    return this.rawSettings.restreamioChannelId
  }

  get name(): string | null {
    return this.rawSettings.name
  }

  get platform(): string | null {
    return this.rawSettings.platform
  }

  constructor(settingsManager: SettingsManager, context: string) {
    this.settingsManager = settingsManager
    this.context = context
  }

  assignRestreamioAccountId(restreamioAccountId: RestreamioAccountId): void {
    this.settingsManager.setContextSettingsAttributes(this.context, {
      restreamioAccountId,
    })
  }

  assignRestreamioChannelId(
    restreamioChannelId: RestreamioChannelId,
    platform: string,
    name: string,
  ): void {
    this.settingsManager.setContextSettingsAttributes(this.context, {
      restreamioChannelId,
      platform,
      name,
    })
  }

  assignRestreamioChannelPlatform(platform: string): void {
    this.settingsManager.setContextSettingsAttributes(this.context, {
      platform,
    })
  }

  assignRestreamioChannelName(name: string): void {
    this.settingsManager.setContextSettingsAttributes(this.context, {
      name,
    })
  }

  unassignRestreamioAccount(): void {
    this.settingsManager.setContextSettingsAttributes(this.context, {
      restreamioAccountId: null,
      restreamioChannelId: null,
      platform: null,
      name: null,
    })
  }
}
