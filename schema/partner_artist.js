import gravity from '../lib/loaders/gravity';
import Partner from './partner';
import Artist from './artist/index';
import numeral from './fields/numeral';
import { IDFields } from './object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
} from 'graphql';

const PartnerArtistType = new GraphQLObjectType({
  name: 'PartnerArtist',
  fields: () => ({
    ...IDFields,
    counts: {
      type: new GraphQLObjectType({
        name: 'PartnerArtistCounts',
        fields: {
          artworks: numeral(({ published_artworks_count }) =>
            published_artworks_count),
          for_sale_artworks: numeral(({ published_for_sale_artworks_count }) =>
            published_for_sale_artworks_count),
        },
      }),
      resolve: (partner_artist) => partner_artist,
    },
    is_display_on_partner_profile: {
      type: GraphQLBoolean,
      resolve: ({ display_on_partner_profile }) => display_on_partner_profile,
    },
    is_represented_by: {
      type: GraphQLBoolean,
    },
    sortable_id: {
      type: GraphQLString,
    },
    is_use_default_biography: {
      type: GraphQLBoolean,
    },
    biography: {
      type: GraphQLString,
    },
    partner: {
      type: Partner.type,
    },
    artist: {
      type: Artist.type,
    },
  }),
});

const PartnerArtist = {
  type: PartnerArtistType,
  description: 'A PartnerArtist',
  args: {
    partner_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Partner',
    },
    artist_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Artist',
    },
  },
  resolve: (root, { partner_id, artist_id }) =>
    gravity(`partner/${partner_id}/artist/${artist_id}`),
};

export default PartnerArtist;
