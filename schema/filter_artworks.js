import gravity from '../lib/loaders/gravity';
import { map, omit, keys } from 'lodash';
import { isExisty } from '../lib/helpers';
import Artwork from './artwork';
import Artist from './artist';
import numeral from './fields/numeral';
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
  GraphQLID,
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
      deprecationReason: 'Favor `counts.total`',
    },
    followed_artists_total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.followed_artists.value,
      deprecationReason: 'Favor `favor counts.followed_artists`',
    },
    counts: {
      type: new GraphQLObjectType({
        name: 'FilterArtworksCounts',
        fields: {
          total: numeral(({ aggregations }) =>
            aggregations.total.value),
          followed_artists: numeral(({ aggregations }) =>
            aggregations.followed_artists.value),
        },
      }),
      resolve: (artist) => artist,
    },
    merchandisable_artists: {
      type: new GraphQLList(Artist.type),
      description: 'Returns a list of merchandisable artists sorted by merch score.',
      resolve: ({ aggregations }) => {
        if (!isExisty(aggregations.merchandisable_artists)) {
          return null;
        }
        return gravity(`artists`, { ids: keys(aggregations.merchandisable_artists) });
      },
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

export const filterArtworksArgs = {
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
    description: 'A string from the list of allocations, or * to denote all mediums',
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
  estimate_range: {
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
  sale_id: {
    type: GraphQLID,
  },
};

// Support passing in your own primary key
// so that you can nest this function into another.

// When given a primary key, this function take the
// value out of the parent payload and moves it into
// the query itself

function filterArtworks(primaryKey) {
  return {
    type: FilterArtworksType,
    description: 'Artworks Elastic Search results',
    args: filterArtworksArgs,
    resolve: (root, options, request, { rootValue: { accessToken } }) => {
      const gravityOptions = Object.assign({}, options);
      if (primaryKey) {
        gravityOptions[primaryKey] = root.id;
      }

      // Support queries that show all mediums using the medium param.
      // If you specify "*" it results in metaphysics removing the query option
      // making the graphQL queries between all and a subset of mediums the same shape.
      if (options.medium === '*') {
        delete gravityOptions.medium;
      }

      return gravity.with(accessToken)('filter/artworks', gravityOptions);
    },
  };
}

export default filterArtworks;
