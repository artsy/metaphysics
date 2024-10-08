import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import { ArticleLayoutEnum } from "schema/v2/article/models"
import ArticlesConnection from "schema/v2/articlesConnection"

export const News: HomeViewSection = {
  id: "home-view-section-news",
  type: HomeViewSectionTypeNames.HomeViewSectionArticles,
  contextModule: ContextModule.marketNews,
  component: {
    title: "News",
    type: "ArticlesCard",
    behaviors: {
      viewAll: {
        buttonText: "More in News",
        ownerType: OwnerType.marketNews,
        href: "/news",
      },
    },
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
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
  }),
}
