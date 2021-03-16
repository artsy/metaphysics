import { GraphQLSchema, GraphQLFieldConfigArgumentMap } from "graphql"
import {
  pageableFilterArtworksArgsWithInput,
  filterArtworksArgs,
} from "schema/v2/filterArtworksConnection"
import gql from "lib/gql"
import { printType } from "lib/stitching/lib/printType"

export const kawsStitchingEnvironmentV2 = (
  localSchema: GraphQLSchema,
  kawsSchema: GraphQLSchema & { transforms: any }
) => {
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`
    extend type Artist {
      marketingCollections(slugs: [String!], category: String, randomizationSeed: String, size: Int, isFeaturedArtistContent: Boolean, showOnEditorial: Boolean): [MarketingCollection]
    }
    extend type Fair {
      marketingCollections(size: Int): [MarketingCollection]!
    }
    extend type Viewer {
      marketingCollections(slugs: [String!], category: String, randomizationSeed: String, size: Int, isFeaturedArtistContent: Boolean, showOnEditorial: Boolean, artistID: String): [MarketingCollection]
    }
    extend type MarketingCollection {
      internalID: ID!
      artworksConnection(${argsToSDL(pageableFilterArtworksArgsWithInput).join(
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
      Fair: {
        marketingCollections: {
          fragment: `
          ... on Fair {
            kawsCollectionSlugs
          }
        `,
          resolve: ({ kawsCollectionSlugs: slugs }, args, context, info) => {
            if (slugs.length === 0) return []
            return info.mergeInfo.delegateToSchema({
              schema: kawsSchema,
              operation: "query",
              fieldName: "marketingCollections",

              args: {
                slugs,
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
              ${Object.keys(filterArtworksArgs).join("\n")}
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
