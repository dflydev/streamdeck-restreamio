import axios, {AxiosInstance, AxiosRequestConfig} from 'axios'
import {ManagedGlobalSettings} from '../settings/managed-global-settings'
import {ManagedSettings} from '../settings/managed-settings'
import {RestreamioStreamingPlatform, RestreamioToken} from './types'
import {SettingsManager} from 'streamdeck-typescript'
import createAuthRefreshInterceptor from 'axios-auth-refresh'
import * as rax from 'retry-axios'

export class RestreamioClient {
  private managedGlobalSettings: ManagedGlobalSettings
  private managedSettings?: ManagedSettings
  private authenticatedAxios: AxiosInstance
  private unAuthenticatedAxios: AxiosInstance

  static fromSettingsManager(
    settingsManager: SettingsManager,
    context?: string,
  ): RestreamioClient {
    return new RestreamioClient(
      new ManagedGlobalSettings(settingsManager),
      context ? new ManagedSettings(settingsManager, context) : undefined,
    )
  }

  constructor(
    managedGlobalSettings: ManagedGlobalSettings,
    managedSettings?: ManagedSettings,
  ) {
    this.managedGlobalSettings = managedGlobalSettings
    this.managedSettings = managedSettings
    this.authenticatedAxios = this.createAuthenticatedAxios()
    this.unAuthenticatedAxios = RestreamioClient.createUnauthenticatedAxios()
  }

  private static createUnauthenticatedAxios(): AxiosInstance {
    const unauthenticatedAxios = axios.create()

    unauthenticatedAxios.defaults.raxConfig = {
      instance: unauthenticatedAxios,
    }

    rax.attach(unauthenticatedAxios)

    return unauthenticatedAxios
  }

  private createAuthenticatedAxios(): AxiosInstance {
    const authenticatedAxios = axios.create()

    authenticatedAxios.interceptors.request.use(request => {
      const token = this.getToken()

      if (!token) {
        return request
      }

      request.headers['Authorization'] = `Bearer ${token.accessToken}`

      return request
    })

    createAuthRefreshInterceptor(authenticatedAxios, async failedRequest => {
      const formData = new FormData()
      formData.append('refresh_token', this.getToken()?.refreshToken ?? '')
      const refreshUrl = process.env.STREAMDECK_RESTREAMIO_REFRESH_URL

      if (!refreshUrl) {
        throw new Error('Refresh URL is not defined')
      }

      return axios
        .post(refreshUrl, formData)
        .then(async tokenRefreshResponse => {
          this.managedGlobalSettings.registerRestreamioAccount(
            tokenRefreshResponse.data,
          )
          failedRequest.response.config.headers[
            'Authorization'
          ] = `Bearer ${tokenRefreshResponse.data.token.accessToken}`

          return Promise.resolve()
        })
    })

    authenticatedAxios.defaults.raxConfig = {
      instance: authenticatedAxios,
    }

    rax.attach(authenticatedAxios)

    return authenticatedAxios
  }

  async getChannel(): Promise<unknown> {
    if (!this.managedSettings?.restreamioChannelId) {
      return {active: false}
    }

    return this.get(
      `https://api.restream.io/v2/user/channel/${this.managedSettings?.restreamioChannelId}`,
    )
  }

  async enableChannel(): Promise<unknown> {
    if (!this.managedSettings?.restreamioChannelId) {
      return
    }

    return await this.patch(
      `https://api.restream.io/v2/user/channel/${this.managedSettings?.restreamioChannelId}`,
      {
        active: true,
      },
    )
  }

  async disableChannel(): Promise<unknown> {
    if (!this.managedSettings?.restreamioChannelId) {
      return
    }

    return await this.patch(
      `https://api.restream.io/v2/user/channel/${this.managedSettings?.restreamioChannelId}`,
      {
        active: false,
      },
    )
  }

  async getChannels(): Promise<unknown> {
    return this.get('https://api.restream.io/v2/user/channel/all')
  }

  private getToken(): RestreamioToken | null {
    if (!this.managedSettings?.restreamioAccountId) {
      return null
    }

    return this.managedGlobalSettings.restreamioAccounts[
      this.managedSettings.restreamioAccountId
    ].token
  }

  async getStreamingPlatforms(): Promise<RestreamioStreamingPlatform[]> {
    const options = {
      method: 'GET',
      url: 'https://api.restream.io/v2/platform/all',
    } as AxiosRequestConfig

    return await axios.request(options).then(response => {
      return response.data
    })
  }

  private async get(url: string): Promise<unknown> {
    const options = {
      method: 'GET',
      url,
    } as AxiosRequestConfig

    return await this.authenticatedAxios
      .request(options)
      .then(function (response) {
        return response.data
      })
  }

  private async patch(url: string, payload: unknown): Promise<unknown> {
    const options = {
      method: 'PATCH',
      url,
      data: payload,
    } as AxiosRequestConfig

    return await this.authenticatedAxios.request(options)
  }
}
