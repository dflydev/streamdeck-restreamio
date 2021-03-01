import {
  DidReceiveSettingsEvent,
  SDOnPiEvent,
  StreamDeckPropertyInspectorHandler,
} from 'streamdeck-typescript'
import {GlobalSettings} from './settings/global-settings'
import {ManagedGlobalSettings} from './settings/managed-global-settings'
import {ManagedSettings} from './settings/managed-settings'
import {RestreamioAccount} from './restreamio/types'
import {Settings} from './settings/settings'
import {RestreamioClient} from './restreamio/restreamio-client'
import {
  DeferredFunction,
  DeferredGlobalSettingsRequests,
} from './settings/deferred-global-settings-requests'
import Timeout = NodeJS.Timeout

class RestreamioPropertyInspector extends StreamDeckPropertyInspectorHandler<
  Settings,
  GlobalSettings
> {
  private deferredGlobalSettingsRequests: DeferredGlobalSettingsRequests
  private restreamioAccountIdElement: HTMLSelectElement
  private restreamioChannelIdElement: HTMLSelectElement
  private restreamioChannelElement: HTMLDivElement
  private restreamioChannelPlatformWrapperElement: HTMLDivElement
  private restreamioChannelNameWrapperElement: HTMLDivElement
  private restreamioChannelPlatformFieldElement: HTMLInputElement
  private restreamioChannelNameFieldElement: HTMLInputElement

  private authWindow: Window | null

  private updateUiTimeoutId: Timeout

  constructor() {
    super()
    this.deferredGlobalSettingsRequests = new DeferredGlobalSettingsRequests(
      this.settingsManager,
    )
  }

  @SDOnPiEvent('documentLoaded')
  private onDocumentLoaded(): void {
    window.addEventListener('message', e => {
      this.withGlobalSettings(
        (globalSettings: ManagedGlobalSettings, settings: ManagedSettings) => {
          const restreamioAccountId = globalSettings.registerRestreamioAccount(
            e.data,
          )
          settings.assignRestreamioAccountId(restreamioAccountId)

          if (this.authWindow) {
            this.authWindow.close()

            this.authWindow = null
          }

          this.updateUi()
        },
      )
    })

    this.restreamioAccountIdElement = document.getElementById(
      'restreamio_account_id',
    ) as HTMLSelectElement
    this.restreamioAccountIdElement.onchange = () => {
      const selectedValue = this.restreamioAccountIdElement.value

      if (selectedValue === '__NEW__') {
        return
      }

      this.withGlobalSettings(
        (globalSettings: ManagedGlobalSettings, settings: ManagedSettings) => {
          if (selectedValue) {
            settings.assignRestreamioAccountId(Number(selectedValue))
          } else {
            settings.unassignRestreamioAccount()
          }

          this.updateUi()
        },
      )
    }

    this.restreamioAccountIdElement.onclick = () => {
      if (this.restreamioAccountIdElement.value !== '__NEW__') {
        return
      }

      const externalUrl = process.env.STREAMDECK_RESTREAMIO_LOGIN_URL

      this.authWindow = window.open(externalUrl, 'Reastream.io')
    }

    this.restreamioChannelElement = document.getElementById(
      'restreamio_channel',
    ) as HTMLDivElement
    this.restreamioChannelPlatformWrapperElement = document.getElementById(
      'restreamio_channel_platform_wrapper',
    ) as HTMLDivElement
    this.restreamioChannelNameWrapperElement = document.getElementById(
      'restreamio_channel_name_wrapper',
    ) as HTMLDivElement
    this.restreamioChannelIdElement = document.getElementById(
      'restreamio_channel_id',
    ) as HTMLSelectElement
    this.restreamioChannelPlatformFieldElement = document.getElementById(
      'restreamio_channel_platform',
    ) as HTMLInputElement
    this.restreamioChannelNameFieldElement = document.getElementById(
      'restreamio_channel_name',
    ) as HTMLInputElement
    this.restreamioChannelIdElement.onchange = () => {
      const selectedValue = this.restreamioChannelIdElement.value

      this.withGlobalSettings(
        (globalSettings: ManagedGlobalSettings, settings: ManagedSettings) => {
          const label =
            this.restreamioChannelIdElement.selectedOptions.item(0)?.text ||
            'Unknown – Unknown'
          const splitLabel = label.split(' – ')
          const platform = splitLabel.shift()
          const name = splitLabel.shift()
          settings.assignRestreamioChannelId(
            Number(selectedValue),
            platform ?? 'Unknown',
            name ?? 'Unknown',
          )

          this.updateUi()
        },
      )
    }

    this.restreamioChannelNameFieldElement.onchange = () => {
      this.withGlobalSettings(
        (globalSettings: ManagedGlobalSettings, settings: ManagedSettings) => {
          settings.assignRestreamioChannelName(
            this.restreamioChannelNameFieldElement.value,
          )
        },
      )
    }

    this.restreamioChannelPlatformFieldElement.onchange = () => {
      this.withGlobalSettings(
        (globalSettings: ManagedGlobalSettings, settings: ManagedSettings) => {
          settings.assignRestreamioChannelPlatform(
            this.restreamioChannelPlatformFieldElement.value,
          )
        },
      )
    }

    this.updateUi()
  }

  @SDOnPiEvent('globalSettingsAvailable')
  private async onGlobalSettingsAvailable(): Promise<void> {
    this.deferredGlobalSettingsRequests.handle()
  }

  @SDOnPiEvent('didReceiveSettings')
  private async onDidReceiveSettings({
    payload: {settings},
  }: DidReceiveSettingsEvent): Promise<void> {
    this.updateUi()
  }

  @SDOnPiEvent('didReceiveGlobalSettings')
  private onDidReceiveGlobalSettings(): void {
    this.updateUi()
  }

  withGlobalSettings(fnc: DeferredFunction): void {
    this.deferredGlobalSettingsRequests.deferOrNow(
      this.globalSettingsReady,
      fnc,
      this.actionInfo.context,
    )
  }

  private updateUi(): void {
    this.withGlobalSettings(
      async (
        globalSettings: ManagedGlobalSettings,
        settings: ManagedSettings,
      ) => {
        clearTimeout(this.updateUiTimeoutId)
        this.updateUiTimeoutId = setTimeout(async () => {
          this.updateRestreamioAccountUi(globalSettings, settings)
          await this.updateRestreamioChannelUi(globalSettings, settings)
        }, 100)
      },
    )
  }

  private async updateRestreamioAccountUi(
    globalSettings: ManagedGlobalSettings,
    settings: ManagedSettings,
  ): Promise<void> {
    while (this.restreamioAccountIdElement.options.length > 0) {
      this.restreamioAccountIdElement.options.remove(0)
    }

    let anAccountIsSelected = false

    globalSettings
      .getRestreamioAccounts()
      .forEach((restreamioAccount: RestreamioAccount) => {
        const option = document.createElement('option')
        option.value = restreamioAccount.profile.id.toString()
        option.text = restreamioAccount.profile.username
        if (restreamioAccount.profile.id === settings.restreamioAccountId) {
          option.selected = true

          anAccountIsSelected = true
        }
        this.restreamioAccountIdElement.options.add(option)
      })

    const blankOption = document.createElement('option')

    if (!anAccountIsSelected) {
      blankOption.selected = !anAccountIsSelected
    }

    this.restreamioAccountIdElement.options.add(blankOption)

    const newOption = document.createElement('option')
    newOption.value = '__NEW__'
    newOption.text = 'Add new account'

    this.restreamioAccountIdElement.options.add(newOption)
  }

  private async updateRestreamioChannelUi(
    globalSettings: ManagedGlobalSettings,
    settings: ManagedSettings,
  ): Promise<void> {
    const restreamioClient = new RestreamioClient(globalSettings, settings)

    let channels: any[] = []

    if (settings.restreamioAccountId) {
      try {
        channels = (await restreamioClient.getChannels()) as any[]
      } catch (e) {
        channels = []
      }
    }

    while (this.restreamioChannelIdElement.options.length > 0) {
      this.restreamioChannelIdElement.options.remove(0)
    }

    let aChannelIsSelected = false

    channels.forEach((channel: any) => {
      const option = document.createElement('option')
      const platform = globalSettings.getRestreamioStreamingPlatformById(
        channel.streamingPlatformId,
      )
      option.value = channel.id
      option.text = `${platform ? platform.name : 'Unknown'} – ${
        channel.displayName
      }`
      if (channel.id === settings.restreamioChannelId) {
        option.selected = true

        aChannelIsSelected = true
      }
      this.restreamioChannelIdElement.options.add(option)
    })

    if (!aChannelIsSelected) {
      const blankOption = document.createElement('option')
      blankOption.selected = true
      this.restreamioChannelIdElement.options.add(blankOption)
    }

    if (this.restreamioChannelIdElement.options.length === 1) {
      this.restreamioChannelElement.style.display = 'none'
    } else {
      this.restreamioChannelElement.style.display = 'flex'
    }

    if (aChannelIsSelected) {
      this.restreamioChannelPlatformFieldElement.value = settings.platform ?? ''
      this.restreamioChannelNameFieldElement.value = settings.name ?? ''

      this.restreamioChannelPlatformWrapperElement.style.display = 'flex'
      this.restreamioChannelNameWrapperElement.style.display = 'flex'
    } else {
      this.restreamioChannelPlatformWrapperElement.style.display = 'none'
      this.restreamioChannelNameWrapperElement.style.display = 'none'
    }
  }
}

new RestreamioPropertyInspector()
