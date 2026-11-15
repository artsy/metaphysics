import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

type TextColor = "BLACK" | "WHITE"

interface AccentColor {
  hex: string
  textColor: TextColor
}

// WCAG 2.x relative luminance of an sRGB channel.
const linearChannel = (channel: number) => {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const parseHex = (hex: string) => {
  const digits = hex.trim().replace(/^#/, "")
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits

  if (!/^[0-9a-f]{6}$/i.test(full)) return null

  return [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16))
}

const textColorFor = (hex: string): TextColor | null => {
  const channels = parseHex(hex)
  if (!channels) return null

  const [red, green, blue] = channels.map(linearChannel)
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

  const contrastWithWhite = 1.05 / (luminance + 0.05)
  const contrastWithBlack = (luminance + 0.05) / 0.05

  return contrastWithWhite > contrastWithBlack ? "WHITE" : "BLACK"
}

export const toAccentColor = (
  hex: string | null | undefined
): AccentColor | null => {
  if (!hex) return null

  const textColor = textColorFor(hex)

  return textColor ? { hex, textColor } : null
}

export const ArtistStoryTextColorType = new GraphQLEnumType({
  name: "ArtistStoryTextColor",
  values: {
    BLACK: { value: "BLACK" },
    WHITE: { value: "WHITE" },
  },
})

export const ArtistStoryAccentColorType = new GraphQLObjectType<
  AccentColor,
  ResolverContext
>({
  name: "ArtistStoryAccentColor",
  fields: {
    hex: { type: new GraphQLNonNull(GraphQLString) },
    textColor: { type: new GraphQLNonNull(ArtistStoryTextColorType) },
  },
})
