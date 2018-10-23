import { GraphQLSchema } from "graphql"

export const kawsStitchingEnvironment = (
  localSchema: GraphQLSchema,
  kawsSchema: GraphQLSchema
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: `
    extend type MarketingCollection {
      artworks(
        acquireable: Boolean
        aggregation_partner_cities: [String]
        aggregations: [ArtworkAggregation]
        artist_id: String
        artist_ids: [String]
        at_auction: Boolean
        attribution_class: [String]
        color: String
        dimension_range: String
        extra_aggregation_gene_ids: [String]
        include_artworks_by_followed_artists: Boolean
        include_medium_filter_in_aggregation: Boolean
        inquireable_only: Boolean
        for_sale: Boolean
        gene_id: String
        gene_ids: [String]
        height: String
        width: String
    
        # A string from the list of allocations, or * to denote all mediums
        medium: String
        period: String
        periods: [String]
        major_periods: [String]
        partner_id: ID
        partner_cities: [String]
        price_range: String
        page: Int
        sale_id: ID
        size: Int
        sort: String
        tag_id: String
        keyword: String
      ): FilterArtworks
    }
  `,

  // Resolvers for the above, this passes in ALL potential parameters
  // from KAWS into filter_artworks to allow end users to dynamically
  // modify query filters using an admin tool
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
            args: {
              ...query,
              ..._args,
            },
            context,
            info,
            transforms: (kawsSchema as any).transforms,
          })
        },
      },
    },
  },
})
