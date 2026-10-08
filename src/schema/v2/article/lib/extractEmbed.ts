import { parse, stringify } from "qs"
import { URL } from "url"

const PROVIDERS = {
  vimeo: "https://player.vimeo.com/video/",
  youtube: "https://www.youtube.com/embed/",
} as const

type Provider = keyof typeof PROVIDERS
type Options = Record<string, string | number | boolean>

const OPTIONS: Record<Provider, Options> = {
  vimeo: {},
  youtube: {
    title: 0,
    portrait: 0,
    badge: 0,
    byline: 0,
    showinfo: 0,
    rel: 0,
    controls: 2,
    modestbranding: 1,
    iv_load_policy: 3,
    color: "E5E5E5",
  },
}

const detectProvider = ({ hostname }: URL): Provider | null => {
  switch (true) {
    case hostname.includes("vimeo.com"):
      return "vimeo"
    case hostname.includes("youtu"):
      return "youtube"
    default:
      return null
  }
}

// Handles watch?v=, youtu.be/, /shorts/ and /embed/ urls, including share
// links that carry extra params such as ?si=
const detectId = ({ pathname, search }: URL, provider: Provider): string => {
  const lastSegment = pathname.split("/").filter(Boolean).pop() as string

  switch (provider) {
    case "youtube":
      return (parse(search.slice(1)).v as string) || lastSegment
    case "vimeo":
      return lastSegment
  }
}

export const extractEmbed = (url: string, options: Options = {}) => {
  const uri = new URL(url)
  const provider = detectProvider(uri)

  if (!provider) return null

  const queryString = stringify({ ...OPTIONS[provider], ...options })
  const id = detectId(uri, provider)
  const src = `${PROVIDERS[provider]}${id}?${queryString}`

  return `<iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`
}

export const isEmbed = (url: string) => {
  const uri = new URL(url)
  return !(detectProvider(uri) === null)
}
