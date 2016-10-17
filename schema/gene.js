import _ from 'lodash';
import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import Artist from './artist';
import Image from './image';
import filterArtworks from './filter_artworks';
import { queriedForFieldsOtherThanBlacklisted } from '../lib/helpers';

import { GravityIDFields } from './object_identification';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const GeneType = new GraphQLObjectType({
  name: 'Gene',
  fields: {
    ...GravityIDFields,
    cached,
    filtered_artworks: filterArtworks('gene_id'),
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

const Gene = {
  type: GeneType,
  args: {
    id: {
      description: 'The slug or ID of the Gene',
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }, request, { fieldASTs }) => {
    // If you are just making an artworks call ( e.g. if paginating )
    // do not make a Gravity call for the gene data.
    const blacklistedFields = ['filtered_artworks', 'id'];
    if (queriedForFieldsOtherThanBlacklisted(fieldASTs, blacklistedFields)) {
      return gravity(`gene/${id}`);
    }
    return { id };
  },
};

export default Gene;
