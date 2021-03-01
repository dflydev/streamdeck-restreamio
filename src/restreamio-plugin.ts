import {SDOnActionEvent, StreamDeckPluginHandler} from 'streamdeck-typescript'
import {ChannelAction} from './actions/channel-action'
import {RestreamioClient} from './restreamio/restreamio-client'
import {ManagedGlobalSettings} from './settings/managed-global-settings'
import {
  DeferredFunction,
  DeferredGlobalSettingsRequests,
} from './settings/deferred-global-settings-requests'

export class RestreamioPlugin extends StreamDeckPluginHandler {
  protected deferredGlobalSettingsRequests: DeferredGlobalSettingsRequests

  constructor() {
    super()
    this.deferredGlobalSettingsRequests = new DeferredGlobalSettingsRequests(
      this.settingsManager,
    )
    new ChannelAction(this, 'com.dflydev.streamdeck.restreamio.channel')
  }

  get managedGlobalSettings(): ManagedGlobalSettings {
    return new ManagedGlobalSettings(this.settingsManager)
  }

  @SDOnActionEvent('setupReady')
  private async onSetupReady(): Promise<void> {
    const restreamioStreamingPlatforms = await RestreamioClient.fromSettingsManager(
      this.settingsManager,
    ).getStreamingPlatforms()

    this.managedGlobalSettings.setRestreamioStreamingPlatforms(
      restreamioStreamingPlatforms,
    )

    this.deferredGlobalSettingsRequests.handle()
  }

  withGlobalSettings(context: string, fnc: DeferredFunction): void {
    this.deferredGlobalSettingsRequests.deferOrNow(
      this.globalSettingsReady,
      fnc,
      context,
    )
  }
}

new RestreamioPlugin()
