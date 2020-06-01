import Article from "./article"
import ArticleSorts from "./sorts/article_sorts"
import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const Articles: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Article.type),
  description: "A list of Articles",
  args: {
    auction_id: {
      type: GraphQLString,
    },
    published: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
    show_id: {
      type: GraphQLString,
    },
    sort: ArticleSorts,
  },
  resolve: (_root, options, { articlesLoader }) => {
    return articlesLoader(options).then((articles) => articles.results)
  },
}

export default Articles
