import {ManagedGlobalSettings} from './managed-global-settings'
import {ManagedSettings} from './managed-settings'
import {SettingsManager} from 'streamdeck-typescript'

export type DeferredFunctionWithoutContext = (
  managedGlobalSettings: ManagedGlobalSettings,
) => void

export type DeferredFunctionWithContext = (
  managedGlobalSettings: ManagedGlobalSettings,
  managedSeetings: ManagedSettings,
) => void

export type DeferredFunction =
  | DeferredFunctionWithoutContext
  | DeferredFunctionWithContext

interface DeferredRequest {
  fnc: DeferredFunction
  context?: string
}

export class DeferredGlobalSettingsRequests {
  private deferredGlobalSettingsRequests: DeferredRequest[] = []
  private settingsManager: SettingsManager

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager
  }

  handle(): void {
    while (this.deferredGlobalSettingsRequests.length > 0) {
      const deferredRequest = this.deferredGlobalSettingsRequests.shift()

      if (!deferredRequest) {
        continue
      }

      if (deferredRequest.context) {
        this.withGlobalSettingsResolvedForContext(
          deferredRequest.fnc,
          deferredRequest.context,
        )
      } else {
        this.withGlobalSettingsResolved(
          deferredRequest.fnc as DeferredFunctionWithoutContext,
        )
      }
    }
  }

  deferOrNow(isReady: boolean, fnc: DeferredFunction, context?: string): void {
    if (isReady) {
      if (context) {
        this.withGlobalSettingsResolvedForContext(fnc, context)
      } else {
        this.withGlobalSettingsResolved(fnc as DeferredFunctionWithoutContext)
      }
    } else {
      this.defer(fnc, context)
    }
  }

  defer(fnc: DeferredFunction, context?: string): void {
    this.deferredGlobalSettingsRequests.push({fnc, context})
  }

  private withGlobalSettingsResolved(
    fnc: DeferredFunctionWithoutContext,
  ): void {
    fnc(new ManagedGlobalSettings(this.settingsManager))
  }

  private withGlobalSettingsResolvedForContext(
    fnc: DeferredFunctionWithContext,
    context: string,
  ): void {
    fnc(
      new ManagedGlobalSettings(this.settingsManager),
      new ManagedSettings(this.settingsManager, context ?? ''),
    )
  }
}
