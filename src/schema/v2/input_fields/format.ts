import { GraphQLEnumType } from "graphql"

const FORMATS = {
  HTML: { value: "html" },
  PLAIN: { value: "plain" },
  MARKDOWN: { value: "markdown" },
} as const

const Format = {
  type: new GraphQLEnumType({
    name: "Format",
    values: FORMATS,
  }),
}

export type TFormat = typeof FORMATS[keyof typeof FORMATS]["value"]

export default Format
