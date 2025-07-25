import Article from "./article"
import ArticleSorts from "./sorts/article_sorts"
import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArticleLayoutEnum } from "./article/models"

const Articles: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Article.type))),
  description: "A list of Articles",
  args: {
    auctionID: { type: GraphQLString },
    authorID: { type: GraphQLString },
    channelID: { type: GraphQLString },
    featured: { type: GraphQLBoolean },
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return articles matching specified ids.
        Accepts list of ids.
      `,
    },
    layout: { type: ArticleLayoutEnum },
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
    omit: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    published: { type: GraphQLBoolean, defaultValue: true },
    showID: { type: GraphQLString },
    sort: ArticleSorts,
  },
  resolve: async (
    _root,
    { auctionID, authorID, channelID, showID, ...rest },
    { articlesLoader }
  ) => {
    const articles = await articlesLoader({
      auction_id: auctionID,
      author_ids: authorID,
      channel_id: channelID,
      show_id: showID,
      ...rest,
    })

    return articles.results
  },
}

export default Articles
