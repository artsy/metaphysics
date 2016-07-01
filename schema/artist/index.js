import {
  defaults,
  compact,
  concat,
  take,
  first,
  assign,
} from 'lodash';
import { exclude } from '../../lib/helpers';
import cached from '../fields/cached';
import initials from '../fields/initials';
import { markdown, formatMarkdownValue } from '../fields/markdown';
import numeral from '../fields/numeral';
import Image from '../image';
import Article from '../article';
import Artwork from '../artwork';
import PartnerArtist from '../partner_artist';
import Meta from './meta';
import PartnerShow from '../partner_show';
import Sale from '../sale/index';
import ArtworkSorts from '../sorts/artwork_sorts';
import ArticleSorts from '../sorts/article_sorts';
import PartnerShowSorts from '../sorts/partner_show_sorts';
import SaleSorts from '../sale/sorts';
import ArtistCarousel from './carousel';
import ArtistStatuses from './statuses';
import gravity from '../../lib/loaders/gravity';
import positron from '../../lib/loaders/positron';
import total from '../../lib/loaders/total';
import ObjectIdentification from '../object_identification';
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
  interfaces: [ObjectIdentification.NodeInterface],
  fields: () => {
    return {
      cached,
      __id: ObjectIdentification.GlobalIDField,
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
      is_display_auction_link: {
        type: GraphQLBoolean,
        resolve: ({ display_auction_link }) => display_auction_link,
      },
      display_auction_link: {
        type: GraphQLBoolean,
        deprecationReason: 'Favor `is_`-prefixed boolean attributes',
      },
      has_metadata: {
        type: GraphQLBoolean,
        resolve: ({ blurb, nationality, years, hometown, location }) => {
          return !!(blurb || nationality || years || hometown || location);
        },
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
      biography: {
        type: Article.type,
        description: 'The Artist biography article written by Artsy',
        resolve: ({ _id }) => {
          return positron('articles', {
            published: true,
            biography_for_artist_id: _id,
            limit: 1,
          }).then(articles => first(articles.results));
        },
      },
      alternate_names: {
        type: new GraphQLList(GraphQLString),
      },
      meta: Meta,
      blurb: assign({
        deprecationReason: 'Use biography_blurb which includes a gallery-submitted fallback.',
      }, markdown()),
      biography_blurb: {
        args: markdown().args,
        type: new GraphQLObjectType({
          name: 'ArtistBlurb',
          fields: {
            text: {
              type: GraphQLString,
              resolve: ({ text }) => text,
            },
            credit: {
              type: GraphQLString,
              resolve: ({ credit }) => credit,
            },
          },
        }),
        resolve: ({ blurb, id }, { format }) => {
          if (blurb.length) {
            return { text: formatMarkdownValue(blurb, format) };
          }
          return gravity(`artist/${id}/partner_artists`, {
            size: 1,
            sort: '-published_artworks_count',
            has_biography: true,
          }).then((partner_artists) => {
            if (partner_artists && partner_artists.length) {
              const { biography, partner } = first(partner_artists);
              return {
                text: biography,
                credit: `Submitted by ${partner.name}`,
              };
            }
          });
        },
      },
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
            for_sale_artworks: numeral(({ forsale_artworks_count }) =>
              forsale_artworks_count),
            partner_shows: numeral(({ id }) =>
              total(`related/shows`, { artist_id: id })),
            related_artists: numeral(({ id }) =>
              total(`related/layer/main/artists`, { artist: id })),
            articles: numeral(({ _id }) =>
              positron('articles', {
                artist_id: _id,
                published: true,
                limit: 1,
              }).then(({ count }) => count)),
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
          ]).then(allShows => take(concat(...allShows), options.size));
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

      partner_artists: {
        type: new GraphQLList(PartnerArtist.type),
        args: {
          size: {
            type: GraphQLInt,
            description: 'The number of PartnerArtists to return',
          },
        },
        resolve: ({ id }, options) => {
          return gravity(`artist/${id}/partner_artists`, options);
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
        args: {
          sort: ArticleSorts,
          limit: {
            type: GraphQLInt,
          },
        },
        type: new GraphQLList(Article.type),
        resolve: ({ _id }, options) =>
          positron('articles', defaults(options, {
            artist_id: _id,
            published: true,
          })).then(({ results }) => results),
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
