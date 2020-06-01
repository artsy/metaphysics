import { getPagingParameters, pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import _ from "lodash"
import cached from "./fields/cached"
import Artist, { artistConnection } from "./artist"
import Image from "./image"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { NodeInterface, SlugAndInternalIDFields } from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import { Searchable } from "./searchable"
import { setVersion } from "./image/normalize"
import { getDefault } from "./image"

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

export const GeneType = new GraphQLObjectType<any, ResolverContext>({
  name: "Gene",
  interfaces: [NodeInterface, Searchable],
  fields: () => {
    const { filterArtworksConnection } = require("./filterArtworksConnection")
    return {
      // Searchable
      displayLabel: {
        type: GraphQLString,
        resolve: ({ display_name }) => display_name,
      },
      imageUrl: {
        type: GraphQLString,
        resolve: ({ images }) => setVersion(getDefault(images), ["square"]),
      },
      // Rest
      ...SlugAndInternalIDFields,
      cached,
      artistsConnection: {
        type: artistConnection.connectionType,
        args: pageable(),
        resolve: ({ id, counts }, options, { geneArtistsLoader }) => {
          const parsedOptions = _.omit(
            convertConnectionArgsToGravityArgs(options),
            "page"
          )
          const gravityOptions = _.extend(parsedOptions, {
            exclude_artists_without_artworks: true,
          })
          return geneArtistsLoader(id, gravityOptions).then((response) => {
            return connectionFromArraySlice(response, options, {
              arrayLength: counts.artists,
              sliceStart: gravityOptions.offset,
            })
          })
        },
      },
      filterArtworksConnection: filterArtworksConnection("gene_id"),
      description: {
        type: GraphQLString,
      },
      displayName: {
        type: GraphQLString,
        resolve: ({ display_name }) => display_name,
      },
      // filteredArtworks: filterArtworks("gene_id"),
      href: {
        type: GraphQLString,
        resolve: ({ id }) => `/gene/${id}`,
      },
      image: Image,
      isPublished: {
        type: GraphQLBoolean,
        resolve: ({ published }) => published,
      },
      isFollowed: {
        type: GraphQLBoolean,
        resolve: ({ id }, _args, { followedGeneLoader }) => {
          if (!followedGeneLoader) return false
          return followedGeneLoader(id).then(({ is_followed }) => is_followed)
        },
      },
      mode: {
        type: GraphQLString,
        resolve: ({ type }) => {
          const isSubjectMatter =
            type && type.name && type.name.match(SUBJECT_MATTER_REGEX)
          return isSubjectMatter ? "artworks" : "artist"
        },
      },
      name: {
        type: GraphQLString,
      },
      similar: {
        type: geneConnection, // eslint-disable-line no-use-before-define
        args: pageable({
          excludeGeneIDs: {
            type: new GraphQLList(GraphQLString),
            description:
              "Array of gene ids (not slugs) to exclude, may result in all genes being excluded.",
          },
        }),
        description: "A list of genes similar to the specified gene",
        resolve: (
          gene,
          { excludeGeneIDs, before, after, first, last },
          { similarGenesLoader }
        ) => {
          const options = {
            before,
            after,
            first,
            last,
            exclude_gene_ids: excludeGeneIDs,
          }
          const { limit: size, offset } = getPagingParameters(options)
          const gravityArgs = {
            size,
            offset,
            exclude_gene_ids: options.exclude_gene_ids,
            total_count: true,
          }

          return similarGenesLoader(gene.id, gravityArgs).then(
            ({ body, headers }) => {
              const genes = body
              const totalCount = parseInt(headers["x-total-count"] || "0", 10)

              return connectionFromArraySlice(genes, options, {
                arrayLength: totalCount,
                sliceStart: offset,
              })
            }
          )
        },
      },
      trendingArtists: {
        type: new GraphQLList(Artist.type),
        args: {
          sample: {
            type: GraphQLInt,
          },
        },
        resolve: ({ id }, options, { trendingArtistsLoader }) => {
          return trendingArtistsLoader({
            gene: id,
          }).then((artists) => {
            if (_.has(options, "sample")) {
              return _.take(_.shuffle(artists), options.sample)
            }
            return artists
          })
        },
      },
    }
  },
})

const Gene: GraphQLFieldConfig<void, ResolverContext> = {
  type: GeneType,
  args: {
    id: {
      description: "The slug or ID of the Gene",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, { geneLoader }, info) => {
    // If you are just making an artworks call ( e.g. if paginating )
    // do not make a Gravity call for the gene data.
    const fieldsNotRequireLoader = [
      "filterArtworksConnection",
      "id",
      "internalID",
    ]
    if (includesFieldsOtherThanSelectionSet(info, fieldsNotRequireLoader)) {
      return geneLoader(id)
    }

    // The family and browsable are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id, published: null, browseable: null }
  },
}

export default Gene

export const geneConnection = connectionDefinitions({
  nodeType: GeneType,
}).connectionType
