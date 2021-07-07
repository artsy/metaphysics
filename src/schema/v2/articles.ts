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
    auctionID: {
      type: GraphQLString,
    },
    featured: {
      type: GraphQLBoolean,
    },
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return articles matching specified ids.
        Accepts list of ids.
      `,
    },
    published: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
    showID: {
      type: GraphQLString,
    },
    sort: ArticleSorts,
  },
  resolve: async (
    _root,
    { auctionID, showID, ...rest },
    { articlesLoader }
  ) => {
    const articles = await articlesLoader({
      auction_id: auctionID,
      show_id: showID,
      ...rest,
    })

    return articles.results
  },
}

export default Articles
