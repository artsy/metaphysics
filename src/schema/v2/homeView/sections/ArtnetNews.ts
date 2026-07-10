import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { ArtnetNewsArticlesConnection } from "schema/v2/artnetNews"

export const ArtnetNews: HomeViewSection = {
  id: "home-view-section-artnet-news",
  type: HomeViewSectionTypeNames.HomeViewSectionArtnetNews,
  contextModule: ContextModule.marketNews,
  component: {
    title: "artnet News",
    behaviors: {
      viewAll: {
        buttonText: "More on artnet News",
        href: "https://news.artnet.com",
      },
    },
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    return ArtnetNewsArticlesConnection.resolve!(parent, args, context, info)
  }),
}
