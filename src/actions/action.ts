import {RestreamioPlugin} from '../restreamio-plugin'
import {ManagedGlobalSettings} from '../settings/managed-global-settings'
import {ManagedSettings} from '../settings/managed-settings'
import {RestreamioClient} from '../restreamio/restreamio-client'
import {StreamDeckAction} from 'streamdeck-typescript'

export abstract class Action<TheAction> extends StreamDeckAction<
  RestreamioPlugin,
  TheAction
> {
  protected restreamioClient(context?: string): RestreamioClient {
    return RestreamioClient.fromSettingsManager(
      this.plugin.settingsManager,
      context,
    )
  }

  protected get globalSettings(): ManagedGlobalSettings {
    return new ManagedGlobalSettings(this.plugin.settingsManager)
  }

  protected settings(context: string): ManagedSettings {
    return new ManagedSettings(this.plugin.settingsManager, context)
  }

  constructor(protected plugin: RestreamioPlugin, actionName: string) {
    super(plugin, actionName)
  }
}
