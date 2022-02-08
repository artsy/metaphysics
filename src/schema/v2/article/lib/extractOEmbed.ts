import fetch from "node-fetch"
import { URL } from "url"

/**
 * * Instagram turned off their old oEmbed endpoint:
 * https://developers.facebook.com/docs/instagram/oembed/
 * which has been replaced with:
 * https://developers.facebook.com/docs/features-reference/oembed-read
 * To use this we need to submit our app for review then sign
 * requests with an access token. Disabled for now.
 */

const PROVIDERS = {
  // instagram: "https://api.instagram.com/oembed",
  twitter: "https://publish.twitter.com/oembed",
} as const

type Provider = keyof typeof PROVIDERS

export const extractOEmbed = async (url: string) => {
  const uri = new URL(url)

  const provider = detectProvider(uri)

  if (!provider) return null

  const res = await fetch(
    `${PROVIDERS[provider]}?url=${encodeURIComponent(url)}`
  )

  return await res.json()
}

const detectProvider = ({ hostname }: URL): Provider | null => {
  switch (true) {
    case hostname.includes("twitter"):
      return "twitter"
    // case hostname.includes("insta"):
    //   return "instagram"
    default:
      return null
  }
}
