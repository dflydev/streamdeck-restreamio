import {
  DidReceiveSettingsEvent,
  KeyUpEvent,
  SDOnActionEvent,
  StateType,
  WillAppearEvent,
  WillDisappearEvent,
} from 'streamdeck-typescript'
import {RestreamioPlugin} from '../restreamio-plugin'
import {Action} from './action'
import {Settings} from '../settings/settings'

export class ChannelAction extends Action<ChannelAction> {
  private channels: Set<string>

  constructor(plugin: RestreamioPlugin, actionName: string) {
    super(plugin, actionName)
    this.channels = new Set<string>()
  }

  @SDOnActionEvent('willAppear')
  private onWillAppear({
    context,
    payload: {isInMultiAction},
  }: WillAppearEvent): void {
    if (!isInMultiAction) {
      this.channels.add(context)
    }

    this.plugin.setState(StateType.OFF, context)
    this.updateUi(context)

    this.plugin.withGlobalSettings(context, () => this.getChannelState(context))
  }

  @SDOnActionEvent('willDisappear')
  private onWillDisappear({
    context,
    payload: {isInMultiAction},
  }: WillDisappearEvent): void {
    if (!isInMultiAction) {
      this.channels.delete(context)
    }
  }

  private getChannelState(context: string): void {
    this.restreamioClient(context)
      .getChannel()
      .then(channelData => {
        const channel = channelData as {active: boolean}
        this.plugin.setState(
          channel.active ? StateType.ON : StateType.OFF,
          context,
        )
      })
  }

  @SDOnActionEvent('didReceiveSettings')
  private onDidReceiveSettings({context}: DidReceiveSettingsEvent): void {
    this.updateUi(context)
  }

  @SDOnActionEvent('keyUp')
  private async onKeyUp({
    context,
    payload: {settings, isInMultiAction, userDesiredState, state},
  }: KeyUpEvent): Promise<void> {
    if (isInMultiAction) {
      if (userDesiredState === StateType.ON) {
        await this.restreamioClient(context).enableChannel()
        this.setAllChannelActionsTo(context, settings, StateType.ON)
      } else {
        await this.restreamioClient(context).disableChannel()
        this.setAllChannelActionsTo(context, settings, StateType.OFF)
      }
    } else {
      if (state === StateType.OFF) {
        try {
          await this.restreamioClient(context).enableChannel()
          this.plugin.showOk(context)
          this.setAllChannelActionsTo(context, settings, StateType.ON)
        } catch (e) {
          console.log('Could not enable channel', e)
          this.plugin.setState(StateType.OFF, context)
          this.plugin.showAlert(context)
        }
      }
      if (state === StateType.ON) {
        try {
          await this.restreamioClient(context).disableChannel()
          this.plugin.showOk(context)
          this.setAllChannelActionsTo(context, settings, StateType.OFF)
        } catch (e) {
          console.log('Could not disable channel', e)
          this.plugin.setState(StateType.ON, context)
          this.plugin.showAlert(context)
        }
      }
    }

    return Promise.resolve()
  }

  private setAllChannelActionsTo(
    context: string,
    settings: Settings,
    desiredState: StateType,
  ): void {
    const ourContext = context
    this.channels.forEach((context: string) => {
      if (ourContext === context) {
        return
      }

      const theirSettings = this.settings(context)

      if (theirSettings.restreamioAccountId !== settings.restreamioAccountId) {
        return
      }

      if (theirSettings.restreamioChannelId !== settings.restreamioChannelId) {
        return
      }

      this.plugin.setState(desiredState, context)
    })
  }

  private async updateUi(context: string): Promise<void> {
    if (
      !this.settings(context).restreamioAccountId ||
      !this.settings(context).restreamioChannelId
    ) {
      return Promise.resolve()
    }

    const platform = this.settings(context).platform
    const name = this.settings(context).name

    this.plugin.setTitle(`${name}\n${platform}`, context)

    return Promise.resolve()
  }
}
