import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLFieldConfigMap,
  GraphQLEnumType,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { MarketingCollectionsSorts } from "./sorts/marketingCollectionsSort"
import { NodeInterface, InternalIDFields } from "./object_identification"
import Image, { normalizeImageData, getDefault } from "schema/v2/image"

const MarketingCollectionQuery = new GraphQLObjectType<any, ResolverContext>({
  name: "MarketingCollectionQuery",
  fields: {
    artistIDs: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ artist_ids }) => artist_ids,
    },
    geneIDs: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ gene_ids }) => gene_ids,
    },
    keyword: {
      type: GraphQLString,
      resolve: ({ keyword }) => keyword,
    },
    tagID: {
      type: GraphQLString,
      resolve: ({ tag_id }) => tag_id,
    },
  },
})

export const MarketingCollectionFields: GraphQLFieldConfigMap<
  any,
  ResolverContext
> = {
  ...InternalIDFields,
  slug: {
    type: GraphQLNonNull(GraphQLString),
    resolve: ({ slug }) => slug,
  },
  thumbnailImage: {
    type: Image.type,
    resolve: async (
      { representativeArtworkID, image_url },
      _args,
      { artworkLoader }
    ) => {
      let imageData: unknown
      if (image_url) {
        imageData = normalizeImageData(image_url)
      } else if (representativeArtworkID) {
        const { images } = await artworkLoader(representativeArtworkID)
        imageData = normalizeImageData(getDefault(images))
      }
      return imageData
    },
  },
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
  isDepartment: {
    type: GraphQLNonNull(GraphQLBoolean),
    resolve: ({ is_department }) => is_department,
  },
  query: {
    type: MarketingCollectionQuery,
    resolve: ({ query }) => query,
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
}

export const MarketingCollectionBaseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MarketingCollectionBase",
  fields: MarketingCollectionFields,
})

const RelatedCollections: GraphQLFieldConfig<any, ResolverContext> = {
  type: GraphQLList(MarketingCollectionBaseType),
  description: "Related Collections",
  args: {
    size: {
      type: GraphQLInt,
      description: "The number of Related Marketing Collections to return",
    },
  },
  resolve: async ({ slug }, _args, { marketingCollectionsLoader }) => {
    const gravityArgs = {
      size: _args.size,
      related_to_collection_id: slug,
    }

    try {
      const { body } = await marketingCollectionsLoader(gravityArgs)
      return body
    } catch (error) {
      console.error(error)
      return null
    }
  },
}

const MarketingCollectionGroupTypeEnum = new GraphQLEnumType({
  name: "MarketingCollectionGroupTypeEnum",
  values: {
    ArtistSeries: {
      value: "ArtistSeries",
    },
    FeaturedCollections: {
      value: "FeaturedCollections",
    },
    OtherCollections: {
      value: "OtherCollections",
    },
  },
})

const MarketingCollectionGroupType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MarketingCollectionGroup",
  fields: {
    groupType: {
      type: MarketingCollectionGroupTypeEnum,
      resolve: ({ group_type }) => group_type,
    },
    internalID: {
      type: GraphQLNonNull(GraphQLID),
      resolve: ({ internalID }) => internalID,
    },
    members: {
      type: GraphQLList(MarketingCollectionBaseType),
      resolve: async (
        { member_ids },
        _args,
        { marketingCollectionsLoader }
      ) => {
        try {
          const { body } = await marketingCollectionsLoader({
            ids: member_ids,
          })
          return body
        } catch (error) {
          console.error(error)
          return null
        }
      },
    },
    name: {
      type: GraphQLString,
      resolve: ({ name }) => name,
    },
  },
})

const LinkedCollections: GraphQLFieldConfig<any, ResolverContext> = {
  type: GraphQLList(MarketingCollectionGroupType),
  description: "Linked Collections",
  resolve: ({ linked_collections }) => {
    return linked_collections
  },
}

export const MarketingCollectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MarketingCollection",
  interfaces: () => {
    const {
      EntityWithArtworksConnectionInterface,
    } = require("./filterArtworksConnection")
    return [NodeInterface, EntityWithArtworksConnectionInterface]
  },
  fields: () => {
    const { filterArtworksConnection } = require("./filterArtworksConnection")
    return {
      ...MarketingCollectionFields,
      relatedCollections: RelatedCollections,
      linkedCollections: LinkedCollections,
      artworksConnection: filterArtworksConnection("marketing_collection_id"),
    }
  },
})

export const MarketingCollection: GraphQLFieldConfig<void, ResolverContext> = {
  type: MarketingCollectionType,
  description: "Marketing Collection",
  args: {
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Marketing Collection",
    },
  },
  resolve: (_root, { slug }, { marketingCollectionLoader }) => {
    return marketingCollectionLoader(slug)
  },
}

export const MarketingCollections: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLList(MarketingCollectionType),
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
    const { size } = convertConnectionArgsToGravityArgs(args)
    const gravityArgs: {
      page?: number
      size: number
      is_featured_artist_content?: boolean
      artist_id?: string
      slugs?: string
      category?: string
      sort?: string
    } = {
      size,
      artist_id: args.artistId,
      is_featured_artist_content: args.isFeaturedArtistContent,
      ...args,
    }

    try {
      const { body } = await marketingCollectionsLoader(gravityArgs)
      return body
    } catch (error) {
      console.error(error)
      return null
    }
  },
}

export const fetchMarketingCollections = async (args, loader) => {
  const { size } = convertConnectionArgsToGravityArgs(args)
  const gravityArgs: { size?: number; slugs?: string[] } = {
    size,
    ...args,
  }

  try {
    const { body } = await loader(gravityArgs)
    return body
  } catch (error) {
    console.error(error)
    return []
  }
}

export const CuratedMarketingCollections: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: new GraphQLList(MarketingCollectionType),
  description: "Curated Marketing Collections",
  args: {
    slugs: {
      type: new GraphQLList(GraphQLString),
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: async (_root, args, { marketingCollectionsLoader }) => {
    const slugs = [
      "trending-now",
      "top-auction-lots",
      "new-this-week",
      "curators-picks-blue-chip",
      "curators-picks-emerging",
    ]
    return fetchMarketingCollections(
      { ...args, slugs },
      marketingCollectionsLoader
    )
  },
}
