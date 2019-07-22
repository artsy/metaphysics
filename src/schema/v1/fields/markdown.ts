import Format from "schema/v1/input_fields/format"
import { GraphQLString, GraphQLFieldConfig } from "graphql"
import { isExisty } from "lib/helpers"
import marked from "marked"

export function formatMarkdownValue(value, format) {
  if (format === "html" || format === "markdown") {
    const renderer = new marked.Renderer()
    marked.setOptions({
      renderer,
      gfm: true,
      tables: true,
      breaks: true,
      pedantic: false,
      sanitize: false,
      smartypants: false,
    })
    return marked(value)
  }

  return value
}

export function markdown(fn?: any): GraphQLFieldConfig<any, any> {
  return {
    type: GraphQLString,
    args: {
      format: Format,
    },
    resolve: (obj, { format }, _, { fieldName }) => {
      const value = fn ? fn(obj) : obj[fieldName]

      if (!isExisty(value)) return null
      return formatMarkdownValue(value, format)
    },
  }
}
