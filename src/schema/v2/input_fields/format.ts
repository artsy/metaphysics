import { GraphQLEnumType } from "graphql"
import { deprecate } from "lib/deprecation"

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
        value: "markdown",
        deprecationReason: deprecate({
          inVersion: 2,
          reason:
            "Deprecated when we deprecated lower-case enum entries, but no alternative was provided. Add an alternative to MP if this is still needed.",
        }),
      },
    },
  }),
}

export default Format
