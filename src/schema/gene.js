import { getPagingParameters, pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import _ from "lodash"
import gravity from "lib/loaders/legacy/gravity"
import cached from "./fields/cached"
import Artwork from "./artwork"
import Artist, { artistConnection } from "./artist"
import Image from "./image"
import filterArtworks, { ArtworkFilterAggregations, filterArtworksArgs, FilterArtworksCounts } from "./filter_artworks"
import { queriedForFieldsOtherThanBlacklisted, parseRelayOptions } from "lib/helpers"
import { GravityIDFields, NodeInterface } from "./object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt, GraphQLBoolean } from "graphql"

const SUBJECT_MATTER_MATCHES = [
  "content",
  "medium",
  "concrete contemporary",
  "abstract contemporary",
  "concept",
  "technique",
  "appearance genes",
]

const SUBJECT_MATTER_REGEX = new RegExp(SUBJECT_MATTER_MATCHES.join("|"), "i")

export const GeneType = new GraphQLObjectType({
  name: "Gene",
  interfaces: [NodeInterface],
  isTypeOf: obj => _.has(obj, "browseable") && (_.has(obj, "published") || _.has(obj, "family")),
  fields: () => {
    return {
      ...GravityIDFields,
      cached,
      artists: {
        type: new GraphQLList(Artist.type),
        resolve: ({ id }) => {
          return gravity(`gene/${id}/artists`, {
            exclude_artists_without_artworks: true,
          })
        },
      },
      artists_connection: {
        type: artistConnection,
        args: pageable(),
        resolve: ({ id, counts }, options) => {
          const parsedOptions = _.omit(parseRelayOptions(options), "page")
          const gravityOptions = _.extend(parsedOptions, {
            exclude_artists_without_artworks: true,
          })
          return gravity(`gene/${id}/artists`, gravityOptions).then(response => {
            return connectionFromArraySlice(response, options, {
              arrayLength: counts.artists,
              sliceStart: gravityOptions.offset,
            })
          })
        },
      },
      artworks_connection: {
        type: connectionDefinitions({
          name: "GeneArtworks",
          nodeType: Artwork.type,
          connectionFields: {
            aggregations: ArtworkFilterAggregations,
            counts: FilterArtworksCounts,
          },
        }).connectionType,
        args: pageable(filterArtworksArgs),
        resolve: ({ id }, options, request, { rootValue: { accessToken } }) => {
          const gravityOptions = parseRelayOptions(options)
          // Do some massaging of the options for ElasticSearch
          gravityOptions.aggregations = options.aggregations || []
          gravityOptions.aggregations.push("total")
          // Remove medium if we are trying to get all mediums
          if (options.medium === "*") {
            delete gravityOptions.medium
          }
          // Manually set the gene_id to the current id
          gravityOptions.gene_id = id
          /**
           * FIXME: There’s no need for this loader to be authenticated (and not cache data), unless the
           *        `include_artworks_by_followed_artists` argument is given. Perhaps we can have specialized loaders
           *        that compose authenticated and unauthenticated loaders based on the request?
           *        Here’s an example of such a setup https://gist.github.com/alloy/69bb274039ecd552de76c3f1739c519e
           */
          return gravity
            .with(accessToken)("filter/artworks", gravityOptions)
            .then(({ aggregations, hits }) => {
              return Object.assign(
                { aggregations }, // Add data to connection so the `aggregations` connection field can resolve it
                connectionFromArraySlice(hits, options, {
                  arrayLength: aggregations.total.value,
                  sliceStart: gravityOptions.offset,
                })
              )
            })
        },
      },
      description: {
        type: GraphQLString,
      },
      display_name: {
        type: GraphQLString,
      },
      filtered_artworks: filterArtworks("gene_id"),
      href: {
        type: GraphQLString,
        resolve: ({ id }) => `gene/${id}`,
      },
      image: Image,
      is_published: {
        type: GraphQLBoolean,
        resolve: ({ published }) => published,
      },
      mode: {
        type: GraphQLString,
        resolve: ({ type }) => {
          const isSubjectMatter = type && type.name && type.name.match(SUBJECT_MATTER_REGEX)
          return isSubjectMatter ? "artworks" : "artist"
        },
      },
      name: {
        type: GraphQLString,
      },
      similar: {
        type: geneConnection, // eslint-disable-line no-use-before-define
        args: pageable({
          exclude_gene_ids: {
            type: new GraphQLList(GraphQLString),
            description: "Array of gene ids (not slugs) to exclude, may result in all genes being excluded.",
          },
        }),
        description: "A list of genes similar to the specified gene",
        resolve: (gene, options, request, { rootValue: { similarGenesLoader } }) => {
          const { limit: size, offset } = getPagingParameters(options)
          const gravityArgs = { size, offset, exclude_gene_ids: options.exclude_gene_ids, total_count: true }

          return similarGenesLoader(gene.id, gravityArgs).then(({ body, headers }) => {
            const genes = body
            const totalCount = headers["x-total-count"]

            return connectionFromArraySlice(genes, options, {
              arrayLength: totalCount,
              sliceStart: offset,
            })
          })
        },
      },
      trending_artists: {
        type: new GraphQLList(Artist.type),
        args: {
          sample: {
            type: GraphQLInt,
          },
        },
        resolve: ({ id }, options) => {
          return gravity(`artists/trending`, {
            gene: id,
          }).then(artists => {
            if (_.has(options, "sample")) return _.take(_.shuffle(artists), options.sample)
            return artists
          })
        },
      },
    }
  },
})

const Gene = {
  type: GeneType,
  args: {
    id: {
      description: "The slug or ID of the Gene",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, _request, { fieldNodes }) => {
    // If you are just making an artworks call ( e.g. if paginating )
    // do not make a Gravity call for the gene data.
    const blacklistedFields = ["filtered_artworks", "id", "__id"]
    if (queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
      return gravity(`gene/${id}`)
    }

    // The family and browsable are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id, published: null, browseable: null }
  },
}

export default Gene

export const geneConnection = connectionDefinitions({
  nodeType: Gene.type,
}).connectionType
