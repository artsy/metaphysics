import _ from 'lodash';
import Artwork from './artwork';
import PartnerShow from './partner_show';
import gravity from '../lib/loaders/gravity';
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
  fields: () => ({
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
        sort: {
          type: new GraphQLEnumType({
            name: 'ArtworkSorts',
            values: {
              'title_asc': { value: 'title' },
              'title_desc': { value: '-title' },
              'created_at_asc': { value: 'created_at' },
              'created_at_desc': { value: '-created_at' },
              'iconicity_desc': { value: '-iconicity' },
              'merchandisability_desc': { value: '-merchandisability' },
              'published_at_asc': { value: 'published_at' },
              'published_at_desc': { value: '-published_at' }
            }
          })
        }
      },
      resolve: ({ id }, options) => {
        return gravity(`artist/${id}/artworks`, _.defaults(options, {
          published: true
        }));
      }
    },
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
        sort: {
          type: new GraphQLEnumType({
            name: 'PartnerShowSorts',
            values: {
              'end_at_asc': { value: 'end_at' },
              'end_at_desc': { value: '-end_at' },
              'start_at_asc': { value: 'start_at' },
              'start_at_desc': { value: '-start_at' },
              'publish_at_asc': { value: 'publish_at' },
              'publish_at_desc': { value: '-publish_at' }
            }
          })
        }
      },
      resolve: ({ id }, options) => {
        return gravity(`related/shows`, _.defaults(options, {
          artist_id: id,
          displayable: true,
          sort: '-end_at'
        }));
      }
    }
  })
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
