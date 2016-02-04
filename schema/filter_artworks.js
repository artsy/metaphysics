import gravity from '../lib/loaders/gravity';
import {
  FilterArtworksType,
  ArtworksAggregation,
} from './aggregations/filter_artworks_aggregation';
import {
  GraphQLList,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLInt,
} from 'graphql';

const FilterArtworks = {
  type: FilterArtworksType,
  description: 'Artworks Elastic Search results',
  args: {
    aggregations: {
      type: new GraphQLNonNull(new GraphQLList(ArtworksAggregation)),
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
  resolve: (root, options) => gravity('filter/artworks', options),
};

export default FilterArtworks;
