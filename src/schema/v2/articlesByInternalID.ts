import Article from "./article"
import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticlesByInternalID: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Article.type),
  description: "A list of articles by internalID.",
  args: {
    ids: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
    },
  },
  resolve: (_root, { ids }, { articleLoader }) => {
    return Promise.all(ids.map(id => articleLoader(id)))
  },
}
