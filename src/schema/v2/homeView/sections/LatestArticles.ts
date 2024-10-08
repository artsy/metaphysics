import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import ArticlesConnection from "schema/v2/articlesConnection"

export const LatestArticles: HomeViewSection = {
  id: "home-view-section-latest-articles",
  type: HomeViewSectionTypeNames.HomeViewSectionArticles,
  contextModule: ContextModule.articleRail,
  component: {
    title: "Artsy Editorial",
    behaviors: {
      viewAll: {
        ownerType: OwnerType.articles,
        href: "/articles",
      },
    },
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(ArticlesConnection.resolve!),
}
