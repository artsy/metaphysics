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
    },
  }),
}

export default Format
