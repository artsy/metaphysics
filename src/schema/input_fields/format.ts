import { GraphQLEnumType } from "graphql"

const Format = {
  type: new GraphQLEnumType({
    name: "Format",
    values: {
      HTML: {
        value: "html",
      },
      PLAIN: {
        value: "plain",
      },
      markdown: {
        // Deprecated
        value: "markdown",
        deprecationReason: "deprecated",
      },
    },
  }),
}

export default Format
