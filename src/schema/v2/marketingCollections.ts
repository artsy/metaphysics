import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import { MarketingCollectionsSorts } from "./sorts/marketingCollectionsSort"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { IDFields, NodeInterface } from "./object_identification"

const MarketingCollectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarketingCollectionType",
  interfaces: [NodeInterface],
  fields: {
    ...IDFields,
    slug: {
      type: GraphQLString,
      resolve: ({ slug }) => slug,
    },
    description: {
      type: GraphQLString,
      resolve: ({ description }) => description,
    },
    createdAt: {
      type: GraphQLString,
      resolve: ({ created_at }) => created_at,
    },
    updatedAt: {
      type: GraphQLString,
      resolve: ({ updated_at }) => updated_at,
    },
    descriptionMarkdown: {
      type: GraphQLString,
      resolve: ({ description_markdown }) => description_markdown,
    },
    credit: {
      type: GraphQLString,
      resolve: ({ credit }) => credit,
    },
    category: {
      type: GraphQLString,
      resolve: ({ category }) => category,
    },
    priceGuidance: {
      type: GraphQLString,
      resolve: ({ price_guidance }) => price_guidance,
    },
    published: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: ({ published }) => published,
    },
    title: {
      type: GraphQLString,
      resolve: ({ title }) => title,
    },
    geneIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ gene_ids }) => gene_ids,
    },
    artistIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ artist_ids }) => artist_ids,
    },
    keyword: {
      type: GraphQLString,
      resolve: ({ keyword }) => keyword,
    },
    isFeaturedArtistContent: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: ({ is_featured_artist_content }) => is_featured_artist_content,
    },
    featuredArtistExclusionIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ featured_artist_exclusion_ids }) =>
        featured_artist_exclusion_ids,
    },
    headerImageId: {
      type: GraphQLString,
      resolve: ({ header_image_id }) => header_image_id,
    },
    thumbnailId: {
      type: GraphQLString,
      resolve: ({ thumbnail_id }) => thumbnail_id,
    },
    showHeaderArtworksRail: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: ({ show_header_artworks_rail }) => show_header_artworks_rail,
    },
    showFeaturedArtists: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: ({ show_featured_artists }) => show_featured_artists,
    },
    artworkIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ artwork_ids }) => artwork_ids,
    },
  },
})

export const MarketingCollectionsConnectionType = connectionWithCursorInfo({
  nodeType: MarketingCollectionType,
})

export const MarketingCollectionsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: MarketingCollectionsConnectionType.connectionType,
  description: "A list of MarketingCollections",
  args: pageable({
    slugs: {
      type: new GraphQLList(GraphQLString),
    },
    artistId: {
      type: GraphQLString,
    },
    category: {
      type: GraphQLString,
    },
    sort: {
      type: MarketingCollectionsSorts,
    },
    isFeaturedArtistContent: {
      type: GraphQLBoolean,
    },
    size: {
      type: GraphQLInt,
    },
  }),
  resolve: async (_root, args, { marketingCollectionsLoader }) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    if (!marketingCollectionsLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { body, headers } = await marketingCollectionsLoader({
      total_count: true,
      page,
      size,
      is_featured_artist_content: args.isFeaturedArtistContent,
      artist_id: args.artistId,
      slugs: args.slugs,
      category: args.category,
      sort: args.sort,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount,
      ...connectionFromArraySlice(body, args, {
        arrayLength: totalCount,
        sliceStart: offset,
      }),
    }
  },
}
