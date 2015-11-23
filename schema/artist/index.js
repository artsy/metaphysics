import _ from 'lodash';
import Image from '../image';
import ArtworkSorts from '../sorts/artwork_sorts'
import PartnerShowSorts from '../sorts/partner_show_sorts'
import ArtistCarousel from './carousel';
import ArtistStatuses from './statuses';
import gravity from '../../lib/loaders/gravity';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLEnumType
} from 'graphql';

let ArtistType = new GraphQLObjectType({
  name: 'Artist',
  fields: () => {
    let Artwork = require('../artwork').default;
    let PartnerShow = require('../partner_show');

    return {
      cached: {
        type: GraphQLInt,
        resolve: ({ cached }) => new Date().getTime() - cached
      },
      id: {
        type: GraphQLString
      },
      href: {
        type: GraphQLString,
        resolve: (artist) => `/artist/${artist.id}`
      },
      sortable_id: {
        type: GraphQLString,
        description: 'Use this attribute to sort by when sorting a collection of Artists'
      },
      name: {
        type: GraphQLString
      },
      years: {
        type: GraphQLString
      },
      nationality: {
        type: GraphQLString
      },
      is_shareable: {
        type: GraphQLBoolean,
        resolve: (artist) => artist.published_artworks_count > 0
      },
      counts: {
        type: new GraphQLObjectType({
          name: 'counts',
          fields: {
            artworks: {
              type: GraphQLInt,
              resolve: ({ published_artworks_count }) => published_artworks_count
            },
            follows: {
              type: GraphQLInt,
              resolve: ({ follow_count }) => follow_count
            },
            auction_lots: {
              type: GraphQLInt,
              resolve: ({ auction_lots_count }) => auction_lots_count
            }
          }
        }),
        resolve: (artist) => artist
      },
      artworks: {
        type: new GraphQLList(Artwork.type),
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of Artworks to return'
          },
          sort: ArtworkSorts,
        },
        resolve: ({ id }, options) => {
          return gravity(`artist/${id}/artworks`, _.defaults(options, {
            published: true
          }));
        }
      },
      image: {
        type: Image.type,
        resolve: (artist) => artist
      },

      artists: {
        type: new GraphQLList(Artist.type),
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of Artists to return'
          }
        },
        resolve: (artist, options) => {
          return gravity(`related/layer/main/artists`, _.defaults(options, {
            exclude_artists_without_artworks: true,
            artist: [artist.id]
          }));
        }
      },

      carousel: ArtistCarousel,

      statuses: ArtistStatuses,

      partner_shows: {
        type: new GraphQLList(PartnerShow.type),
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of PartnerShows to return'
          },
          solo_show: {
            type: GraphQLBoolean
          },
          top_tier: {
            type: GraphQLBoolean
          },
          sort: PartnerShowSorts
        },
        resolve: ({ id }, options) => {
          return gravity('related/shows', _.defaults(options, {
            artist_id: id,
            displayable: true,
            sort: '-end_at'
          }));
        }
      }
    };
  }
});

let Artist = {
  type: ArtistType,
  description: 'An Artist',
  args: {
    id: {
      description: 'The slug or ID of the Artist',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: (root, { id }) => gravity(`artist/${id}`)
};

export default Artist;
