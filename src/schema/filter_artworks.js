import { map, omit, keys, create, assign } from "lodash"
import { isExisty } from "lib/helpers"
import Artwork from "./artwork"
import Artist from "./artist"
import Tag from "./tag"
import numeral from "./fields/numeral"
import { computeTotalPages, createPageCursors } from "./fields/pagination"
import { artworkConnection } from "./artwork"
import { pageable } from "relay-cursor-paging"
import {
  convertConnectionArgsToGravityArgs,
  queriedForFieldsOtherThanBlacklisted,
  removeNulls,
} from "lib/helpers"
import { connectionFromArraySlice, toGlobalId } from "graphql-relay"
import {
  ArtworksAggregationResultsType,
  ArtworksAggregation,
} from "./aggregations/filter_artworks_aggregation"
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
  GraphQLUnionType,
  GraphQLNonNull,
} from "graphql"

import { NodeInterface } from "schema/object_identification"

const ArtworkFilterTagType = create(Tag.type, {
  name: "ArtworkFilterTag",
  isTypeOf: ({ context_type }) => context_type === "Tag",
})

const ArtworkFilterGeneType = create(Tag.type, {
  name: "ArtworkFilterGene",
  isTypeOf: ({ context_type }) => context_type === "Gene",
})

export const ArtworkFilterFacetType = new GraphQLUnionType({
  name: "ArtworkFilterFacet",
  types: [ArtworkFilterTagType, ArtworkFilterGeneType],
})

export const ArtworkFilterAggregations = {
  description: "Returns aggregation counts for the given filter query.",
  type: new GraphQLList(ArtworksAggregationResultsType),
  resolve: ({ aggregations }) => {
    const allowedAggregations = omit(aggregations, [
      "total",
      "followed_artists",
    ])
    return map(allowedAggregations, (counts, slice) => ({
      slice,
      counts,
    }))
  },
}

export const FilterArtworksCounts = {
  type: new GraphQLObjectType({
    name: "FilterArtworksCounts",
    fields: {
      total: numeral(({ aggregations }) => aggregations.total.value),
      followed_artists: numeral(
        ({ aggregations }) => aggregations.followed_artists.value
      ),
    },
  }),
  resolve: data => data,
}

export const FilterArtworksType = new GraphQLObjectType({
  name: "FilterArtworks",
  interfaces: [NodeInterface],
  fields: () => ({
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the object.",
      resolve: ({ options }) =>
        toGlobalId("FilterArtworks", JSON.stringify(options)),
    },
    aggregations: ArtworkFilterAggregations,
    artworks_connection: {
      type: artworkConnection,
      deprecationReason:
        "Favour artwork connections that take filter arguments.",
      args: pageable({
        sort: {
          type: GraphQLString,
        },
      }),
      resolve: (
        { options: gravityOptions },
        args,
        request,
        { rootValue: { filterArtworksLoader } }
      ) => {
        const relayOptions = convertConnectionArgsToGravityArgs(args)

        return filterArtworksLoader(
          assign(gravityOptions, relayOptions, {})
        ).then(({ aggregations, hits }) => {
          if (!aggregations || !aggregations.total) {
            throw new Error("This query must contain the total aggregation")
          }

          const totalPages = computeTotalPages(
            aggregations.total.value,
            relayOptions.size
          )

          return assign(
            {
              pageCursors: createPageCursors(
                relayOptions,
                aggregations.total.value
              ),
            },
            connectionFromArraySlice(hits, args, {
              arrayLength: Math.min(
                aggregations.total.value,
                totalPages * relayOptions.size
              ),
              sliceStart: relayOptions.offset,
            })
          )
        })
      },
    },
    counts: FilterArtworksCounts,
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
      description:
        "Returns a list of merchandisable artists sorted by merch score.",
      resolve: (
        { aggregations },
        options,
        request,
        { rootValue: { artistsLoader } }
      ) => {
        if (!isExisty(aggregations.merchandisable_artists)) {
          return null
        }
        return artistsLoader({
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
      resolve: (
        { options },
        _options,
        _request,
        { rootValue: { geneLoader, tagLoader } }
      ) => {
        const { tag_id, gene_id } = options
        if (tag_id) {
          return tagLoader(tag_id).then(tag =>
            assign({ context_type: "Tag" }, tag)
          )
        }
        if (gene_id) {
          return geneLoader(gene_id).then(gene =>
            assign({ context_type: "Gene" }, gene)
          )
        }
        return null
      },
    },
  }),
})

export const filterArtworksArgs = {
  acquireable: {
    type: GraphQLBoolean,
  },
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
  at_auction: {
    type: GraphQLBoolean,
  },
  attribution_class: {
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
  include_medium_filter_in_aggregation: {
    type: GraphQLBoolean,
  },
  inquireable_only: {
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
    description:
      "A string from the list of allocations, or * to denote all mediums",
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
    resolve: (
      root,
      options,
      request,
      { fieldNodes, rootValue: { filterArtworksLoader } }
    ) => {
      const gravityOptions = Object.assign({}, options)
      if (primaryKey) {
        gravityOptions[primaryKey] = root.id
      }

      // Support queries that show all mediums using the medium param.
      // If you specify "*" it results in metaphysics removing the query option
      // making the graphQL queries between all and a subset of mediums the same shape.
      if (gravityOptions.medium === "*" || !gravityOptions.medium) {
        delete gravityOptions.medium
      }

      removeNulls(gravityOptions)

      const blacklistedFields = ["artworks_connection", "__id"]
      if (queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
        return filterArtworksLoader(gravityOptions).then(response =>
          assign({}, response, { options: gravityOptions })
        )
      }
      return { hits: null, aggregations: null, options: gravityOptions }
    },
  }
}

export default filterArtworks
