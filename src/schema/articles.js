import Article from "./article"
import ArticleSorts from "./sorts/article_sorts"
import { GraphQLString, GraphQLBoolean, GraphQLList } from "graphql"

const Articles = {
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
  resolve: (root, options, request, { rootValue: { articlesLoader } }) => {
    return articlesLoader(options).then(articles => articles.results)
  },
}

export default Articles
