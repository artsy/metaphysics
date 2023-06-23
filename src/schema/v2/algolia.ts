/*
 * TODO: remove once older Android (<= 8.9.0 becomes negligible)
 */

import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

// replace stitched Gravity types with these matching definitions

const DEPRECATION_REASON = "Algolia search is no longer supported"

const AlgoliaType = new GraphQLObjectType({
  name: "Algolia",
  fields: () => ({
    apiKey: {
      type: GraphQLNonNull(GraphQLString),
      deprecationReason: DEPRECATION_REASON,
    },
    appID: {
      type: GraphQLNonNull(GraphQLString),
      deprecationReason: DEPRECATION_REASON,
    },
    indices: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(AlgoliaIndexType))),
      deprecationReason: DEPRECATION_REASON,
    },
  }),
})

const AlgoliaIndexType = new GraphQLObjectType({
  name: "AlgoliaIndex",
  fields: {
    displayName: {
      type: GraphQLNonNull(GraphQLString),
      deprecationReason: DEPRECATION_REASON,
    },
    key: {
      type: GraphQLNonNull(GraphQLString),
      deprecationReason: DEPRECATION_REASON,
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
      deprecationReason: DEPRECATION_REASON,
    },
  },
})

// replace stitched Gravity field with this stub

export const Algolia: GraphQLFieldConfig<void, ResolverContext> = {
  type: AlgoliaType,
  deprecationReason: DEPRECATION_REASON,
  description:
    "Deprecated Algolia fields, temporarily kept for legacy compatibility",
  resolve: () => {
    return {
      appID: process.env.ALGOLIA_APP_ID || "unavailable",
      apiKey: "unavailable",
      indices: INDICES,
    }
  },
}

const env = process.env.SYSTEM_ENVIRONMENT || "staging"

const INDICES = [
  {
    displayName: "Artist",
    key: "artist",
    name: `Artist_${env}`,
  },
  {
    displayName: "Article",
    key: "article",
    name: `Article_${env}`,
  },
  {
    displayName: "Auction",
    key: "sale",
    name: `Sale_${env}`,
  },
  {
    displayName: "Artist Series",
    key: "artist_series",
    name: `ArtistSeries_${env}`,
  },
  {
    displayName: "Collection",
    key: "marketing_collection",
    name: `MarketingCollection_${env}`,
  },
  {
    displayName: "Fair",
    key: "fair",
    name: `Fair_${env}`,
  },
  {
    displayName: "Show",
    key: "partner_show",
    name: `PartnerShow_${env}`,
  },
  {
    displayName: "Gallery",
    key: "partner_gallery",
    name: `PartnerGallery_${env}`,
  },
]
