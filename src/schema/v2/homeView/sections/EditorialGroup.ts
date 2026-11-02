import { connectionFromArray } from "graphql-relay"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewGroupSection } from "../sectionTypes/Group"
import { LatestArticles } from "./LatestArticles"
import { News } from "./News"
import ArticlesConnection from "schema/v2/articlesConnection"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import { ArticleLayoutEnum } from "schema/v2/article/models"
import { normalize, setVersion } from "schema/v2/image/normalize"

// How many news articles surface as cards below the editorial lead rail.
const NEWS_CARD_COUNT = 6

// Preferred card thumbnail versions; setVersion falls back to largest if none match.
const CARD_IMAGE_VERSIONS = ["large", "larger", "main", "medium"]

// Resolve an article's (possibly `:version`-templated) thumbnail to a concrete URL.
const articleThumbnailURL = (thumbnailImage: any): string | undefined => {
  const normalized = thumbnailImage && normalize(thumbnailImage)
  return normalized ? setVersion(normalized, CARD_IMAGE_VERSIONS) : undefined
}

export const EditorialGroup: HomeViewGroupSection = {
  id: "home-view-section-editorial-group",
  type: HomeViewSectionTypeNames.HomeViewSectionGroup,
  featureFlag: "onyx_home-feed-simplification",
  component: {
    title: "Artsy Editorial",
    description: "Your guide to the art world",
    type: "SectionGroup",
  },
  requiresAuthentication: false,
  // TODO: palette token once available.
  backgroundColor: "#FEF8ED",

  // Relabeled "Editorial" so it doesn't duplicate the container's "Artsy Editorial" header.
  rails: [{ sectionID: LatestArticles.id, title: "Editorial" }],

  // "View all" follows the News rail's own href + ownerType so the two stay in sync.
  cardGroups: [
    {
      title: "Art News",
      href: News.component?.behaviors?.viewAll?.href ?? undefined,
      ownerType: News.component?.behaviors?.viewAll?.ownerType ?? undefined,
      resolver: async (parent, args, context, info) => {
        const connection: any = await ArticlesConnection.resolve!(
          parent,
          {
            published: true,
            sort: ArticleSorts.type.getValue("PUBLISHED_AT_DESC")?.value,
            layout: ArticleLayoutEnum.getValue("NEWS")?.value,
            first: NEWS_CARD_COUNT,
          },
          context,
          info
        )

        const cards = (connection?.edges ?? []).map(({ node }) => ({
          title: node.title,
          href: `/article/${node.slug}`,
          imageURL: articleThumbnailURL(node.thumbnail_image),
          entityType: "Article",
          entityID: node.id,
        }))

        return connectionFromArray(cards, args)
      },
    },
  ],
}
