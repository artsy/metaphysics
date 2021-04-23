import Format, { FormatType } from "schema/v2/input_fields/format"
import { GraphQLString, GraphQLFieldConfig } from "graphql"
import { isExisty, markdownToPlainText } from "lib/helpers"
import marked from "marked"
import { ResolverContext } from "types/graphql"

type Value = string | null | undefined

export const formatMarkdownValue = (
  value: string,
  format: FormatType
): string => {
  switch (format) {
    case "html": {
      const renderer = new marked.Renderer()

      marked.setOptions({
        renderer,
        gfm: true,
        breaks: true,
        pedantic: false,
        sanitize: false,
        smartypants: false,
        tables: true,
      })

      return marked(value)
    }
    case "markdown":
      return value
    case "plain":
      return markdownToPlainText(value)
    default:
      return value
  }
}

export const markdown = <T>(
  fn?: (response: T) => Value
): GraphQLFieldConfig<T, ResolverContext> => {
  return {
    type: GraphQLString,
    args: {
      format: Format,
    },
    resolve: (obj, { format }, _, { fieldName }) => {
      const value: Value = fn ? fn(obj) : obj[fieldName]

      if (!isExisty(value) || typeof value !== "string") return null

      return formatMarkdownValue(value, format)
    },
  }
}
