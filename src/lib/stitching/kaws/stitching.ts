import {
  GraphQLSchema,
  GraphQLFieldConfigArgumentMap,
  GraphQLType,
  isScalarType,
  isEnumType,
  isListType,
} from "graphql"
import { filterArtworksArgs as filterArtworksArgsV1 } from "schema/v1/filter_artworks"
import { filterArtworksArgs as filterArtworksArgsV2WithoutPageable } from "schema/v2/filterArtworksConnection"
import { pageable } from "relay-cursor-paging"
import gql from "lib/gql"

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
      },
    },
  }
}

export const kawsStitchingEnvironmentV2 = (
  localSchema: GraphQLSchema,
  kawsSchema: GraphQLSchema & { transforms: any }
) => {
  const filterArtworksArgsV2 = pageable(filterArtworksArgsV2WithoutPageable)
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`
    extend type Artist {
      marketingCollections(slugs: [String!], category: String, randomizationSeed: String, size: Int, isFeaturedArtistContent: Boolean, showOnEditorial: Boolean): [MarketingCollection]
    }
    extend type Viewer {
      marketingCollections(slugs: [String!], category: String, randomizationSeed: String, size: Int, isFeaturedArtistContent: Boolean, showOnEditorial: Boolean, artistID: String): [MarketingCollection]
    }
    extend type MarketingCollection {
      artworksConnection(${argsToSDL(filterArtworksArgsV2).join(
        "\n"
      )}): FilterArtworksConnection
    }
    type HomePageMarketingCollectionsModule {
      results: [MarketingCollection]!
    }
    extend type HomePage {
      marketingCollectionsModule: HomePageMarketingCollectionsModule
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
            internalID
          }
        `,
          resolve: ({ internalID: artistID }, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: kawsSchema,
              operation: "query",
              fieldName: "marketingCollections",

              args: {
                artistID,
                ...args,
              },
              context,
              info,
            })
          },
        },
      },
      HomePage: {
        marketingCollectionsModule: {
          fragment: gql`
              ... on HomePage {
                __typename
              }
            `,
          resolve: () => {
            return {}
          },
        },
      },
      HomePageMarketingCollectionsModule: {
        results: {
          fragment: gql`
            ... on HomePageMarketingCollectionsModule {
              __typename
            }
          `,
          resolve: async (_source, _args, context, info) => {
            try {
              // We hard-code the collections slugs here in MP so that the app
              // can display different collections based only on an MP change
              // (and not an app deploy).
              return await info.mergeInfo.delegateToSchema({
                schema: kawsSchema,
                operation: "query",
                fieldName: "marketingCollections",
                args: {
                  slugs: [
                    "new-this-week",
                    "auction-highlights",
                    "trending-emerging-artists",
                  ],
                },
                context,
                info,
              })
            } catch (error) {
              // The schema guarantees a present array for results, so fall back
              // to an empty one if the request to kaws fails. Note that we
              // still bubble-up any errors in the GraphQL response.
              return []
            }
          },
        },
      },
      Viewer: {
        marketingCollections: {
          fragment: gql`
            ...on Viewer {
              __typename
            }
          `,
          resolve: async (_source, args, context, info) => {
            return await info.mergeInfo.delegateToSchema({
              schema: kawsSchema,
              operation: "query",
              fieldName: "marketingCollections",

              args,
              context,
              info,
            })
          },
        },
      },
      MarketingCollection: {
        artworksConnection: {
          fragment: `
          fragment MarketingCollectionQuery on MarketingCollection {
            query {
              ${Object.keys(filterArtworksArgsV2).join("\n")}
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
              fieldName: "artworksConnection",
              args: {
                ...query,
                keywordMatchExact: hasKeyword,
                ..._args,
              },
              context,
              info,
            })
          },
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

function printType(type: GraphQLType): string {
  if (isScalarType(type)) {
    return type.name
  } else if (isListType(type)) {
    return `[${printType(type.ofType)}]`
  } else if (isEnumType(type)) {
    return type.name
  } else {
    throw new Error(`Unknown type: ${JSON.stringify(type)}`)
  }
}
