import { GraphQLEnumType } from "graphql"

export const FORMATS = {
  HTML: { value: "html" },
  PLAIN: { value: "plain" },
  MARKDOWN: { value: "markdown" },
} as const

export const FormatEnums = new GraphQLEnumType({
  name: "Format",
  values: FORMATS,
})

const Format = {
  type: FormatEnums,
}

export type FormatType = typeof FORMATS[keyof typeof FORMATS]["value"]

export default Format
