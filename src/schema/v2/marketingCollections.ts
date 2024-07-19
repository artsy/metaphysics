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
import { MarketingCollectionsSorts } from "./sorts/marketingCollectionsSort"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { SlugAndInternalIDFields, NodeInterface } from "./object_identification"

export const MarketingCollectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MarketingCollection",
  interfaces: [NodeInterface],
  fields: {
    ...SlugAndInternalIDFields,
    description: {
      type: GraphQLString,
      resolve: ({ description }) => description,
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
    // @ts-ignore
    relatedCollections,
  },
})

const relatedCollections: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLList(MarketingCollectionType),
  description: "Related Collections",
  resolve: async (
    { id, size },
    _args,
    { relatedMarketingCollectionsLoader }
  ) => {
    const gravityArgs = {
      size,
    }
    return await relatedMarketingCollectionsLoader(id, gravityArgs)
  },
}

export const MarketingCollection: GraphQLFieldConfig<void, ResolverContext> = {
  type: MarketingCollectionType,
  description: "Marketing Collection",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Marketing Collection",
    },
  },
  resolve: (_root, { id }, { marketingCollectionLoader }) => {
    return marketingCollectionLoader(id)
  },
}

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
    const gravityArgs: {
      page?: number
      size: number
      total_count: boolean
      is_featured_artist_content?: boolean
      artist_id?: string
      slugs?: string
      category?: string
      sort?: string
    } = {
      size,
      total_count: true,
      artist_id: args.artistId,
      is_featured_artist_content: args.isFeaturedArtistContent,
      ...args,
    }

    const { body, headers } = await marketingCollectionsLoader(gravityArgs)
    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
