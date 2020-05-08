import Format from "schema/v2/input_fields/format"
import { GraphQLString, GraphQLFieldConfig } from "graphql"
import { isExisty } from "lib/helpers"
import marked from "marked"
import { ResolverContext } from "types/graphql"

type Format = "html" | "markdown"
type Value = string | null | undefined

export const formatMarkdownValue = (value: string, format: Format): string => {
  if (format === "html" || format === "markdown") {
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

  return value
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
