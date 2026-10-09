import { connectionFromArray } from "graphql-relay"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewCurationAreaSection } from "../sectionTypes/CurationArea"
import { LatestArticles } from "./LatestArticles"
import { News } from "./News"
import ArticlesConnection from "schema/v2/articlesConnection"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import { ArticleLayoutEnum } from "schema/v2/article/models"

// How many news articles surface as chips below the editorial lead rail.
const NEWS_CHIP_COUNT = 6

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

  // Lead = the existing editorial rail, rendered inline (resolved by reference).
  leadSectionID: LatestArticles.id,
  leadTitle: "Editorial",
  chipsTitle: "Art News",
  // "View all" for the chips group follows the News rail's own destination,
  // so the two stay in sync (relative href; Eigen resolves the env host).
  chipsHref: News.component?.behaviors?.viewAll?.href ?? undefined,

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
      // TODO: confirm sizing/version handling for the article thumbnail URL.
      imageURL: node.thumbnail_image?.image_url,
      entityType: "Article",
      entityID: node.id,
    }))

    return connectionFromArray(chips, args)
  },
}
