import gravity from "lib/loaders/gravity"
import { map, omit, keys, create, assign } from "lodash"
import { isExisty } from "lib/helpers"
import Artwork from "./artwork"
import Artist from "./artist"
import Tag from "./tag"
import numeral from "./fields/numeral"
import { artworkConnection } from "./artwork"
import { pageable } from "relay-cursor-paging"
import { parseRelayOptions } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import { ArtworksAggregationResultsType, ArtworksAggregation } from "./aggregations/filter_artworks_aggregation"
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
  GraphQLUnionType,
} from "graphql"

const ArtworkFilterTagType = create(Tag.type, {
  name: "ArtworkFilterTag",
  isTypeOf: ({ context_type }) => context_type === "Tag",
})

export const ArtworkFilterFacetType = new GraphQLUnionType({
  name: "ArtworkFilterFacet",
  types: [ArtworkFilterTagType],
})

export const FilterArtworksType = new GraphQLObjectType({
  name: "FilterArtworks",
  fields: () => ({
    aggregations: {
      description: "Returns aggregation counts for the given filter query.",
      type: new GraphQLList(ArtworksAggregationResultsType),
      resolve: ({ aggregations }) => {
        const whitelistedAggregations = omit(aggregations, ["total", "followed_artists"])
        return map(whitelistedAggregations, (counts, slice) => ({
          slice,
          counts,
        }))
      },
    },
    artworks_connection: {
      type: artworkConnection,
      args: pageable(),
      resolve: ({ hits, aggregations }, options) => {
        if (!aggregations || !aggregations.total) {
          throw new Error("This query must contain the total aggregation")
        }
        const relayOptions = parseRelayOptions(options)
        return connectionFromArraySlice(hits, options, {
          arrayLength: aggregations.total.value,
          sliceStart: relayOptions.offset,
        })
      },
    },
    counts: {
      type: new GraphQLObjectType({
        name: "FilterArtworksCounts",
        fields: {
          total: numeral(({ aggregations }) => aggregations.total.value),
          followed_artists: numeral(({ aggregations }) => aggregations.followed_artists.value),
        },
      }),
      resolve: artist => artist,
    },
    followed_artists_total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.followed_artists.value,
      deprecationReason: "Favor `favor counts.followed_artists`",
    },
    hits: {
      description: "Artwork results.",
      type: new GraphQLList(Artwork.type),
    },
    merchandisable_artists: {
      type: new GraphQLList(Artist.type),
      description: "Returns a list of merchandisable artists sorted by merch score.",
      resolve: ({ aggregations }) => {
        if (!isExisty(aggregations.merchandisable_artists)) {
          return null
        }
        return gravity(`artists`, {
          ids: keys(aggregations.merchandisable_artists),
        })
      },
    },
    total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.total.value,
      deprecationReason: "Favor `counts.total`",
    },
    facet: {
      type: ArtworkFilterFacetType,
      resolve: ({ options }) => {
        const { tag_id } = options
        if (tag_id) {
          return gravity(`tag/${tag_id}`).then(tag => assign({ context_type: "Tag" }, tag))
        }
        return null
      },
    },
  }),
})

export const filterArtworksArgs = {
  aggregation_partner_cities: {
    type: new GraphQLList(GraphQLString),
  },
  aggregations: {
    type: new GraphQLList(ArtworksAggregation),
  },
  artist_id: {
    type: GraphQLString,
  },
  artist_ids: {
    type: new GraphQLList(GraphQLString),
  },
  color: {
    type: GraphQLString,
  },
  dimension_range: {
    type: GraphQLString,
  },
  extra_aggregation_gene_ids: {
    type: new GraphQLList(GraphQLString),
  },
  include_artworks_by_followed_artists: {
    type: GraphQLBoolean,
  },
  for_sale: {
    type: GraphQLBoolean,
  },
  gene_id: {
    type: GraphQLString,
  },
  gene_ids: {
    type: new GraphQLList(GraphQLString),
  },
  height: {
    type: GraphQLString,
  },
  width: {
    type: GraphQLString,
  },
  medium: {
    type: GraphQLString,
    description: "A string from the list of allocations, or * to denote all mediums",
  },
  period: {
    type: GraphQLString,
  },
  periods: {
    type: new GraphQLList(GraphQLString),
  },
  major_periods: {
    type: new GraphQLList(GraphQLString),
  },
  partner_id: {
    type: GraphQLID,
  },
  partner_cities: {
    type: new GraphQLList(GraphQLString),
  },
  price_range: {
    type: GraphQLString,
  },
  page: {
    type: GraphQLInt,
  },
  sale_id: {
    type: GraphQLID,
  },
  size: {
    type: GraphQLInt,
  },
  sort: {
    type: GraphQLString,
  },
  tag_id: {
    type: GraphQLString,
  },
  keyword: {
    type: GraphQLString,
  },
}

// Support passing in your own primary key
// so that you can nest this function into another.

// When given a primary key, this function take the
// value out of the parent payload and moves it into
// the query itself

function filterArtworks(primaryKey) {
  return {
    type: FilterArtworksType,
    description: "Artworks Elastic Search results",
    args: filterArtworksArgs,
    resolve: (root, options, request, { rootValue: { accessToken } }) => {
      const gravityOptions = Object.assign({}, options)
      if (primaryKey) {
        gravityOptions[primaryKey] = root.id
      }

      // Support queries that show all mediums using the medium param.
      // If you specify "*" it results in metaphysics removing the query option
      // making the graphQL queries between all and a subset of mediums the same shape.
      if (options.medium === "*") {
        delete gravityOptions.medium
      }

      return gravity
        .with(accessToken)("filter/artworks", gravityOptions)
        .then(response => assign({}, response, { options: gravityOptions }))
    },
  }
}

export default filterArtworks
