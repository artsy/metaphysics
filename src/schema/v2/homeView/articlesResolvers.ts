import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import ArticlesConnection from "../articlesConnection"
import ArticleSorts from "../sorts/article_sorts"
import { ArticleLayoutEnum } from "../article/models"

/*
 * Resolvers for home view articels sections
 */

export const LatestArticlesResolvers: GraphQLFieldResolver<
  any,
  ResolverContext
> = ArticlesConnection.resolve!

export const NewsResolver: GraphQLFieldResolver<any, ResolverContext> = async (
  parent,
  args,
  context,
  info
) => {
  const finalArgs = {
    // formerly specified client-side
    published: true,
    sort: ArticleSorts.type.getValue("PUBLISHED_AT_DESC")?.value,
    layout: ArticleLayoutEnum.getValue("NEWS")?.value,

    ...args,
  }

  const result = await ArticlesConnection.resolve!(
    parent,
    finalArgs,
    context,
    info
  )

  return result
}
