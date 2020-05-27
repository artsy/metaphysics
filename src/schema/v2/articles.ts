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
  resolve: (_root, { auctionID, showID, ..._options }, { articlesLoader }) => {
    const options: any = {
      auction_id: auctionID,
      show_id: showID,
      ..._options,
    }
    return articlesLoader(options).then((articles) => articles.results)
  },
}

export default Articles
