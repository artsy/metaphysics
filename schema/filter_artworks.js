import gravity from '../lib/loaders/gravity';
import { map, omit } from 'lodash';
import Artwork from './artwork';
import {
  ArtworksAggregationResultsType,
  ArtworksAggregation,
} from './aggregations/filter_artworks_aggregation';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';

export const FilterArtworksType = new GraphQLObjectType({
  name: 'FilterArtworks',
  fields: () => ({
    hits: {
      description: 'Artwork results.',
      type: new GraphQLList(Artwork.type),
    },
    total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.total.value,
    },
    followed_artists_total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.followed_artists.value,
    },
    aggregations: {
      description: 'Returns aggregation counts for the given filter query.',
      type: new GraphQLList(ArtworksAggregationResultsType),
      resolve: ({ aggregations }) => {
        const whitelistedAggregations = omit(aggregations, ['total', 'followed_artists']);
        return map(whitelistedAggregations, (counts, slice) => ({ slice, counts }));
      },
    },
  }),
});

const FilterArtworks = {
  type: FilterArtworksType,
  description: 'Artworks Elastic Search results',
  args: {
    aggregation_partner_cities: {
      type: new GraphQLList(GraphQLString),
    },
    aggregations: {
      type: new GraphQLList(ArtworksAggregation),
    },
    artist_id: {
      type: GraphQLInt,
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
    partner_cities: {
      type: new GraphQLList(GraphQLString),
    },
    price_range: {
      type: GraphQLString,
    },
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
    sort: {
      type: GraphQLString,
    },
  },
  resolve: (root, options, { rootValue: { accessToken } }) => {
    if (accessToken) {
      return gravity.with(accessToken)('filter/artworks', options);
    }
    return gravity('filter/artworks', options);
  },
};

export default FilterArtworks;
