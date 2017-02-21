// @flow
import type { GraphQLFieldConfig } from 'graphql';
import { pageable } from 'relay-cursor-paging';
import { connectionFromArraySlice } from 'graphql-relay';
import _ from 'lodash';
import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import { artworkConnection } from './artwork';
import Artist from './artist';
import Image from './image';
import filterArtworks, { filterArtworksArgs } from './filter_artworks';
import { queriedForFieldsOtherThanBlacklisted, parseRelayOptions } from '../lib/helpers';
import { GravityIDFields, NodeInterface } from './object_identification';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const GeneType = new GraphQLObjectType({
  name: 'Gene',
  interfaces: [NodeInterface],
  isTypeOf: (obj) => _.has(obj, 'family') && _.has(obj, 'browseable'),
  fields: {
    ...GravityIDFields,
    cached,
    filtered_artworks: filterArtworks('gene_id'),
    artworks_connection: {
      type: artworkConnection,
      args: pageable(filterArtworksArgs),
      resolve: ({ id }, options, request, { rootValue: { accessToken } }) => {
        const gravityOptions = parseRelayOptions(options);
        // Do some massaging of the options for ElasticSearch
        gravityOptions.aggregations = options.aggregations || [];
        gravityOptions.aggregations.push('total');
        // Remove medium if we are trying to get all mediums
        if (options.medium === '*') {
          delete gravityOptions.medium;
        }
        // Manually set the gene_id to the current id
        gravityOptions.gene_id = id;
        return gravity.with(accessToken)('filter/artworks', gravityOptions)
          .then((response) => {
            return connectionFromArraySlice(response.hits, options, {
              arrayLength: response.aggregations.total.value,
              sliceStart: gravityOptions.offset,
            });
          });
      },
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `gene/${id}`,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    image: Image,
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: ({ id }) => {
        return gravity(`gene/${id}/artists`, {
          exclude_artists_without_artworks: true,
        });
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
          if (_.has(options, 'sample')) return _.take(_.shuffle(artists), options.sample);
          return artists;
        });
      },
    },
  },
});

const Gene: GraphQLFieldConfig<GeneType, *> = {
  type: GeneType,
  args: {
    id: {
      description: 'The slug or ID of the Gene',
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }, request, { fieldNodes }) => {
    // If you are just making an artworks call ( e.g. if paginating )
    // do not make a Gravity call for the gene data.
    const blacklistedFields = ['filtered_artworks', 'id'];
    if (!fieldNodes || queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
      return gravity(`gene/${id}`);
    }

    // The family and browsable are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id, family: null, browseable: null };
  },
};

export default Gene;
