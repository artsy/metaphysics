import { GraphQLEnumType } from "graphql"

const ArticleSorts = {
  type: new GraphQLEnumType({
    name: "ArticleSorts",
    values: {
      PUBLISHED_AT_ASC: {
        value: "published_at",
      },
      PUBLISHED_AT_DESC: {
        value: "-published_at",
      },
    },
  }),
}

export default ArticleSorts
