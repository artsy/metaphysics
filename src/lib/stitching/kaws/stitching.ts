import { GraphQLSchema } from "graphql"

export const kawsStitchingEnvironment = (
  localSchema: GraphQLSchema,
  kawsSchema: GraphQLSchema
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: `
    extend type MarketingCollection {
      artworks: FilterArtworks
    }
  `,

  // Resolvers for the above
  resolvers: {
    MarketingCollection: {
      artworks: {
        fragment: `
          fragment MarketingCollectionQuery on MarketingCollection { 
            query {
              acquireable
              aggregations
              artist_ids
              artist_id
              at_auction
              color
              dimension_range
              extra_aggregation_gene_ids
              include_artworks_by_followed_artists
              include_medium_filter_in_aggregation
              inquireable_only
              for_sale
              gene_id
              gene_ids
              height
              width
              medium
              period
              periods
              major_periods
              partner_id
              partner_cities
              price_range
              page
              sale_id
              size
              sort
              tag_id
              keyword
            } 
          }
        `,
        resolve: (parent, _args, context, info) => {
          const query = parent.query
          return info.mergeInfo.delegateToSchema({
            schema: localSchema,
            operation: "query",
            fieldName: "filter_artworks",
            args: query,
            context,
            info,
            transforms: (kawsSchema as any).transforms,
          })
        },
      },
    },
  },
})
