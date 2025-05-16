import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import ArticlesConnection from "schema/v2/articlesConnection"
import ArticleSorts from "schema/v2/sorts/article_sorts"

export const LatestArticles: HomeViewSection = {
  id: "home-view-section-latest-articles",
  type: HomeViewSectionTypeNames.HomeViewSectionArticles,
  contextModule: ContextModule.articleRail,
  component: {
    title: "Artsy Editorial",
    description: "Your guide to the art world",
    behaviors: {
      viewAll: {
        ownerType: OwnerType.articles,
        href: "/articles",
      },
    },
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const finalArgs = {
      // formerly specified client-side
      published: true,
      sort: ArticleSorts.type.getValue("PUBLISHED_AT_DESC")?.value,
      featured: true,
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
