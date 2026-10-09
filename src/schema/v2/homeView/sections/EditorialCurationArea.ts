import { connectionFromArray } from "graphql-relay"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewCurationAreaSection } from "../sectionTypes/CurationArea"
import { LatestArticles } from "./LatestArticles"
import { News } from "./News"
import ArticlesConnection from "schema/v2/articlesConnection"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import { ArticleLayoutEnum } from "schema/v2/article/models"
import { normalize, setVersion } from "schema/v2/image/normalize"

// How many news articles surface as chips below the editorial lead rail.
const NEWS_CHIP_COUNT = 6

// Preferred thumbnail versions for a news chip; setVersion falls back to the
// largest available if none match.
const CHIP_IMAGE_VERSIONS = ["large", "larger", "main", "medium"]

// Resolve an article's (possibly `:version`-templated) thumbnail to a concrete URL.
const articleThumbnailURL = (thumbnailImage: any): string | undefined => {
  const normalized = thumbnailImage && normalize(thumbnailImage)
  return normalized ? setVersion(normalized, CHIP_IMAGE_VERSIONS) : undefined
}

/**
 * "Artsy Editorial" curation area: the existing editorial articles rail shown as
 * the lead, with latest News-layout articles as entry chips below it. A second
 * instance of HomeViewSectionCurationArea — same shape, different content.
 *
 * Sub-labels ("Editorial", "Art News") live here so this block's copy can be
 * edited without affecting the standalone LatestArticles / News rails.
 */
export const EditorialCurationArea: HomeViewCurationAreaSection = {
  id: "home-view-section-editorial-curation-area",
  type: HomeViewSectionTypeNames.HomeViewSectionCurationArea,
  // Gated behind the experiment flag (off in prod, on in staging/review).
  featureFlag: "onyx_home-feed-simplification",
  component: {
    title: "Artsy Editorial",
    description: "Your guide to the art world",
    type: "CurationArea",
  },
  requiresAuthentication: false,

  // One rail: the existing editorial rail, relabeled "Editorial" (its standalone
  // title is "Artsy Editorial", which the container header already uses).
  rails: [{ sectionID: LatestArticles.id, title: "Editorial" }],
  chipsTitle: "Art News",
  // "View all" for the chips group follows the News rail's own destination +
  // owner type, so the two stay in sync (relative href; Eigen resolves the env
  // host and fires the view-all tracking with chipsOwnerType).
  chipsHref: News.component?.behaviors?.viewAll?.href ?? undefined,
  chipsOwnerType: News.component?.behaviors?.viewAll?.ownerType ?? undefined,

  // Chips = latest News-layout articles mapped to cards. Reuses ArticlesConnection
  // (and thus News's exact filter mapping); articles already carry a thumbnail
  // and slug, so each chip gets an image + href with no new upstream plumbing.
  resolver: async (parent, args, context, info) => {
    const connection: any = await ArticlesConnection.resolve!(
      parent,
      {
        published: true,
        sort: ArticleSorts.type.getValue("PUBLISHED_AT_DESC")?.value,
        layout: ArticleLayoutEnum.getValue("NEWS")?.value,
        first: NEWS_CHIP_COUNT,
      },
      context,
      info
    )

    const chips = (connection?.edges ?? []).map(({ node }) => ({
      title: node.title,
      href: `/article/${node.slug}`,
      imageURL: articleThumbnailURL(node.thumbnail_image),
      entityType: "Article",
      entityID: node.id,
    }))

    return connectionFromArray(chips, args)
  },
}
