import {
  defaults,
  compact,
  concat,
  take,
  sortBy,
  reverse,
} from 'lodash';
import { exclude } from '../../lib/helpers';
import cached from '../fields/cached';
import initials from '../fields/initials';
import markdown from '../fields/markdown';
import numeral from '../fields/numeral';
import Image from '../image';
import Article from '../article';
import Artwork from '../artwork';
import Meta from './meta';
import PartnerShow from '../partner_show';
import Sale from '../sale/index';
import ArtworkSorts from '../sorts/artwork_sorts';
import PartnerShowSorts from '../sorts/partner_show_sorts';
import SaleSorts from '../sale/sorts';
import ArtistCarousel from './carousel';
import ArtistStatuses from './statuses';
import gravity from '../../lib/loaders/gravity';
import positron from '../../lib/loaders/positron';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLEnumType,
} from 'graphql';

const ArtistType = new GraphQLObjectType({
  name: 'Artist',
  fields: () => {
    return {
      cached,
      _id: {
        type: GraphQLString,
      },
      id: {
        type: GraphQLString,
      },
      href: {
        type: GraphQLString,
        resolve: (artist) => `/artist/${artist.id}`,
      },
      sortable_id: {
        type: GraphQLString,
        description: 'Use this attribute to sort by when sorting a collection of Artists',
      },
      name: {
        type: GraphQLString,
      },
      initials: initials('name'),
      gender: {
        type: GraphQLString,
      },
      years: {
        type: GraphQLString,
      },
      is_public: {
        type: GraphQLBoolean,
        resolve: artist => artist.public,
      },
      is_consignable: {
        type: GraphQLBoolean,
        resolve: ({ consignable }) => consignable,
      },
      public: {
        type: GraphQLBoolean,
        deprecationReason: 'Favor `is_`-prefixed boolean attributes',
      },
      consignable: {
        type: GraphQLBoolean,
        deprecationReason: 'Favor `is_`-prefixed boolean attributes',
      },
      display_auction_link: {
        type: GraphQLBoolean,
      },
      hometown: {
        type: GraphQLString,
      },
      location: {
        type: GraphQLString,
      },
      nationality: {
        type: GraphQLString,
      },
      birthday: {
        type: GraphQLString,
      },
      deathday: {
        type: GraphQLString,
      },
      alternate_names: {
        type: new GraphQLList(GraphQLString),
      },
      meta: Meta,
      blurb: markdown(),
      is_shareable: {
        type: GraphQLBoolean,
        resolve: (artist) => artist.published_artworks_count > 0,
      },
      bio: {
        type: GraphQLString,
        resolve: ({ nationality, years, hometown, location }) => {
          return compact([
            nationality,
            years,
            hometown,
            (location ? `based in ${location}` : undefined),
          ]).join(', ');
        },
      },
      counts: {
        type: new GraphQLObjectType({
          name: 'ArtistCounts',
          fields: {
            artworks: numeral(({ published_artworks_count }) =>
              published_artworks_count),
            follows: numeral(({ follow_count }) =>
              follow_count),
            auction_lots: numeral(({ auction_lots_count }) =>
              auction_lots_count),
            for_sale_artworks: numeral(({ forsale_artworks_count }) =>
              forsale_artworks_count),
          },
        }),
        resolve: (artist) => artist,
      },
      artworks: {
        type: new GraphQLList(Artwork.type),
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of Artworks to return',
          },
          page: {
            type: GraphQLInt,
          },
          sort: ArtworkSorts,
          published: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
          filter: {
            type: new GraphQLList(new GraphQLEnumType({
              name: 'ArtistArtworksFilters',
              values: {
                IS_FOR_SALE: {
                  value: 'for_sale',
                },
                IS_NOT_FOR_SALE: {
                  value: 'not_for_sale',
                },
              },
            })),
          },
          exclude: {
            type: new GraphQLList(GraphQLString),
          },
        },
        resolve: ({ id }, options) =>
          gravity(`artist/${id}/artworks`, options)
            .then(exclude(options.exclude, 'id')),
      },
      image: Image,
      artists: {
        type: new GraphQLList(Artist.type), // eslint-disable-line no-use-before-define
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of Artists to return',
          },
          exclude_artists_without_artworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        },
        resolve: (artist, options) => {
          return gravity(`related/layer/main/artists`, defaults(options, {
            artist: [artist.id],
          }));
        },
      },

      contemporary: {
        type: new GraphQLList(Artist.type), // eslint-disable-line no-use-before-define
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of Artists to return',
          },
          exclude_artists_without_artworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        },
        resolve: (artist, options) => {
          return gravity(`related/layer/contemporary/artists`, defaults(options, {
            artist: [artist.id],
          }));
        },
      },

      carousel: ArtistCarousel,

      statuses: ArtistStatuses,

      exhibition_highlights: {
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of Artists to return',
            defaultValue: 5,
          },
        },
        type: new GraphQLList(PartnerShow.type),
        resolve: ({ id }, options) => {
          return Promise.all([
            // Highest tier solo institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: true,
              highest_tier: true,
              solo_show: true,
              at_a_fair: false,
              size: options.size,
            }),
            // Highest tier solo gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: false,
              highest_tier: true,
              solo_show: true,
              at_a_fair: false,
              size: options.size,
            }),
            // Highest tier group institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: true,
              highest_tier: true,
              solo_show: false,
              at_a_fair: false,
              size: options.size,
            }),
            // Highest tier group gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: false,
              highest_tier: true,
              solo_show: false,
              at_a_fair: false,
              size: options.size,
            }),
            // Lower tier solo institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: true,
              highest_tier: false,
              solo_show: true,
              at_a_fair: false,
              size: options.size,
            }),
            // Lower tier solo gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: false,
              highest_tier: false,
              solo_show: true,
              at_a_fair: false,
              size: options.size,
            }),
            // Lower tier group institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: true,
              highest_tier: false,
              solo_show: false,
              at_a_fair: false,
              size: options.size,
            }),
            // Lower tier group gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              is_institution: false,
              highest_tier: false,
              solo_show: false,
              at_a_fair: false,
              size: options.size,
            }),
            // Fair booths
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              displayable: true,
              at_a_fair: true,
              size: options.size,
            }),
          ]).then(allShows => reverse(sortBy(take(concat(...allShows), options.size), 'end_at')));
        },
      },

      partner_shows: {
        type: new GraphQLList(PartnerShow.type),
        args: {
          at_a_fair: {
            type: GraphQLBoolean,
          },
          active: {
            type: GraphQLBoolean,
          },
          status: {
            type: GraphQLString,
          },
          size: {
            type: GraphQLInt,
            description: 'The number of PartnerShows to return',
          },
          solo_show: {
            type: GraphQLBoolean,
          },
          top_tier: {
            type: GraphQLBoolean,
          },
          sort: PartnerShowSorts,
        },
        resolve: ({ id }, options) => {
          return gravity('related/shows', defaults(options, {
            artist_id: id,
            displayable: true,
            sort: '-end_at',
          }));
        },
      },

      sales: {
        type: new GraphQLList(Sale.type),
        args: {
          live: {
            type: GraphQLBoolean,
          },
          is_auction: {
            type: GraphQLBoolean,
          },
          size: {
            type: GraphQLInt,
            description: 'The number of Sales to return',
          },
          sort: SaleSorts,
        },
        resolve: ({ id }, options) => {
          return gravity('related/sales', defaults(options, {
            artist_id: id,
            sort: '-end_at',
          }));
        },
      },

      articles: {
        type: new GraphQLList(Article.type),
        resolve: ({ _id }) =>
          positron('articles', { artist_id: _id, published: true })
            .then(({ results }) => results),
      },
    };
  },
});

const Artist = {
  type: ArtistType,
  description: 'An Artist',
  args: {
    id: {
      description: 'The slug or ID of the Artist',
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }) => gravity(`artist/${id}`),
};

export default Artist;
