export interface RestreamioAccountCollection {
  [key: string]: RestreamioAccount
}

export interface RestreamioAccount {
  profile: RestreamioProfile
  token: RestreamioToken
}

export interface RestreamioProfile {
  id: RestreamioAccountId
  email: RestreamioEmail
  username: RestreamioUsername
}

export type RestreamioRefreshedTokenCallback = (
  restreamioToken: RestreamioToken,
) => void
export type RestreamioChannelId = number

export type RestreamioAccountId = number
export type RestreamioEmail = string
export type RestreamioUsername = string

export type RestreamioStreamingPlatformId = number

export type RestreamioStreamingPlatformImageUrl = string

export interface RestreamioStreamingPlatformImage {
  svg: RestreamioStreamingPlatformImageUrl
  png: RestreamioStreamingPlatformImageUrl
}

export interface RestreamioStreamingPlatform {
  id: RestreamioStreamingPlatformId
  name: string
  url: string
  image: RestreamioStreamingPlatformImage
  altImage: RestreamioStreamingPlatformImage
}

export interface RestreamioToken {
  tokenType: RestreamioTokenType
  tokenScope: RestreamioTokenScope
  accessToken: RestreamioAccessToken
  accessTokenEpochExpirationTime: RestreamioAccessTokenEpochExpirationTime
  refreshToken: RestreamioRefreshToken
  refreshTokenEpochExpirationTime: RestreamioRefreshTokenEpochExpirationTime
}

export type RestreamioEpochExpirationTime = bigint

export type RestreamioTokenType = string
export type RestreamioTokenScope = string

export type RestreamioAccessToken = string
export type RestreamioAccessTokenEpochExpirationTime = RestreamioEpochExpirationTime

export type RestreamioRefreshToken = string
export type RestreamioRefreshTokenEpochExpirationTime = RestreamioEpochExpirationTime
