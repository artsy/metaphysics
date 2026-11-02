import { connectionFromArray } from "graphql-relay"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewGroupSection } from "../sectionTypes/Group"
import { HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION } from "../sectionTypes/groupMinimumEigenVersion"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { LatestArticles } from "./LatestArticles"
import { News } from "./News"
import ArticlesConnection from "schema/v2/articlesConnection"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import { ArticleLayoutEnum } from "schema/v2/article/models"
import { normalize, setVersion } from "schema/v2/image/normalize"

const NEWS_CARD_COUNT = 6

const CARD_IMAGE_VERSIONS = ["large", "larger", "main", "medium"]

const articleThumbnailURL = (thumbnailImage: any): string | undefined => {
  const normalized = thumbnailImage && normalize(thumbnailImage)
  return normalized ? setVersion(normalized, CARD_IMAGE_VERSIONS) : undefined
}

export const EditorialGroup: HomeViewGroupSection = {
  id: "home-view-section-editorial-group",
  type: HomeViewSectionTypeNames.HomeViewSectionGroup,
  featureFlag: "onyx_home-feed-simplification",
  minimumEigenVersion: HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION,
  component: {
    title: "Artsy Editorial",
    description: "Your guide to the art world",
    type: "SectionGroup",
  },
  requiresAuthentication: false,
  // TODO: palette token once available.
  backgroundColor: "#FEF8ED",
  rails: [{ sectionID: LatestArticles.id, title: "Editorial" }],
  cardGroups: [
    {
      title: "Art News",
      href: News.component?.behaviors?.viewAll?.href ?? undefined,
      ownerType: News.component?.behaviors?.viewAll?.ownerType ?? undefined,
      resolver: withHomeViewTimeout(async (parent, args, context, info) => {
        const connection: any = await (ArticlesConnection.resolve!(
          parent,
          {
            published: true,
            sort: ArticleSorts.type.getValue("PUBLISHED_AT_DESC")?.value,
            layout: ArticleLayoutEnum.getValue("NEWS")?.value,
            first: NEWS_CARD_COUNT,
          },
          context,
          info
        ) as Promise<any>).catch(() => null)

        const cards = (connection?.edges ?? []).map(({ node }) => ({
          title: node.title,
          href: `/article/${node.slug}`,
          imageURL: articleThumbnailURL(node.thumbnail_image),
          entityType: "Article",
          entityID: node.id,
        }))

        return connectionFromArray(cards, args)
      }),
    },
  ],
}
