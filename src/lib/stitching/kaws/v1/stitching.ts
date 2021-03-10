import { GraphQLSchema, GraphQLFieldConfigArgumentMap } from "graphql"
import { printType } from "lib/stitching/lib/printType"
import { filterArtworksArgs as filterArtworksArgsV1 } from "schema/v1/filter_artworks"

/**
 * NOTE: V1 has been deprecated. See V2 below
 */
export const kawsStitchingEnvironmentV1 = (
  localSchema: GraphQLSchema,
  kawsSchema: GraphQLSchema & { transforms: any }
) => {
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: `
    extend type Artist {
      marketingCollections(size: Int): [MarketingCollection]
    }
    extend type MarketingCollection {
      internalID: ID!
      artworks(${argsToSDL(filterArtworksArgsV1).join("\n")}): FilterArtworks
    }
  `,

    // Resolvers for the above, this passes in ALL potential parameters
    // from KAWS into filter_artworks to allow end users to dynamically
    // modify query filters using an admin tool
    resolvers: {
      Artist: {
        marketingCollections: {
          fragment: `
          ... on Artist {
            _id
          }
        `,
          resolve: ({ _id: artistID }, { size }, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: kawsSchema,
              operation: "query",
              fieldName: "marketingCollections",

              args: {
                artistID,
                size,
              },
              context,
              info,
            })
          },
        },
      },
      MarketingCollection: {
        artworks: {
          fragment: `
          fragment MarketingCollectionQuery on MarketingCollection {
            query {
              ${Object.keys(filterArtworksArgsV1).join("\n")}
            }
          }
        `,
          resolve: (parent, _args, context, info) => {
            const query = parent.query
            const hasKeyword = Boolean(parent.query.keyword)

            const existingLoader =
              context.unauthenticatedLoaders.filterArtworksLoader
            const newLoader = (loaderParams) => {
              return existingLoader.call(null, loaderParams, {
                requestThrottleMs: 1000 * 60 * 60,
              })
            }

            // TODO: Should this really modify the context in place?
            context.unauthenticatedLoaders.filterArtworksLoader = newLoader

            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "filter_artworks",
              args: {
                ...query,
                keyword_match_exact: hasKeyword,
                ..._args,
              },
              context,
              info,
            })
          },
        },
        internalID: {
          fragment: `
          fragment MarketingCollectionIDQuery on MarketingCollection {
            id
          }
        `,
          resolve: ({ id }, _args, _context, _info) => id,
        },
      },
    },
  }
}

// Very contrived version of what exists in graphql-js but isn’t exported.
// https://github.com/graphql/graphql-js/blob/master/src/utilities/schemaPrinter.js
function argsToSDL(args: GraphQLFieldConfigArgumentMap) {
  const result: string[] = []
  Object.keys(args).forEach((argName) => {
    result.push(`${argName}: ${printType(args[argName].type)}`)
  })
  return result
}
