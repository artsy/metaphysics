import {
  assign,
  compact,
  concat,
  defaults,
  first,
  has,
  take,
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
import Show from '../show';
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
import { GravityIDFields, NodeInterface } from '../object_identification';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLEnumType,
} from 'graphql';

// TODO Get rid of this when we remove the deprecated PartnerShow in favour of Show.
const ShowField = {
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
    is_reference: {
      type: GraphQLBoolean,
    },
    visible_to_public: {
      type: GraphQLBoolean,
    },
    sort: PartnerShowSorts,
  },
  resolve: ({ id }, options) => {
    return gravity('related/shows', defaults(options, {
      artist_id: id,
      sort: '-end_at',
    }));
  },
};

const ArtistType = new GraphQLObjectType({
  name: 'Artist',
  interfaces: [NodeInterface],
  isTypeOf: (obj) => has(obj, 'birthday') && has(obj, 'artworks_count'),
  fields: () => {
    return {
      ...GravityIDFields,
      cached,
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
        description: 'Only specific Artists should show a link to auction results.',
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
      formatted_nationality_and_birthday: {
        type: GraphQLString,
        description: 'A string of the form "Nationality, Birthday (or Birthday-Deathday)"',
        resolve: ({ birthday, nationality, deathday }) => {
          let formatted_bday = (!isNaN(birthday) && birthday) ? 'b. ' + birthday : birthday;
          formatted_bday = formatted_bday && formatted_bday.replace(/born/i, 'b.');

          if ((!isNaN(deathday) && deathday)) {
            formatted_bday = `${formatted_bday.replace('b. ', '')}–${deathday.match(/\d+/)}`;
          }

          if (nationality && formatted_bday) {
            return nationality + ', ' + formatted_bday;
          }

          return nationality || formatted_bday;
        },
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
      blurb: {
        args: markdown().args,
        type: GraphQLString,
        resolve: ({ blurb }, { format }) => {
          if (blurb.length) {
            return formatMarkdownValue(blurb, format);
          }
        },
      },
      biography_blurb: {
        args: assign({
          partner_bio: {
            type: GraphQLBoolean,
            description: 'If true, will return featured bio over Artsy one.',
            defaultValue: false,
          },
        }, markdown().args),
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
            partner_id: {
              type: GraphQLString,
              resolve: ({ partner_id }) => partner_id,
              description: 'The partner id of the partner who submitted the featured bio.',
            },
          },
        }),
        resolve: ({ blurb, id }, { format, partner_bio }) => {
          if (!partner_bio && blurb && blurb.length) {
            return { text: formatMarkdownValue(blurb, format) };
          }
          return gravity(`artist/${id}/partner_artists`, {
            size: 1,
            featured: true,
          }).then((partner_artists) => {
            if (partner_artists && partner_artists.length) {
              const { biography, partner } = first(partner_artists);
              return {
                text: formatMarkdownValue(biography, format),
                credit: `Submitted by ${partner.name}`,
                partner_id: partner.id,
              };
            }
            return { text: formatMarkdownValue(blurb, format) };
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
            partner_shows: numeral(({ partner_shows_count }) =>
              partner_shows_count),
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
      formatted_artworks_count: {
        type: GraphQLString,
        description: 'A string showing the total number of works and those for sale',
        resolve: ({ published_artworks_count, forsale_artworks_count }) => {
          let totalWorks = null;
          if (published_artworks_count) {
            totalWorks = published_artworks_count +
              (published_artworks_count > 1 ? ' works' : ' work');
          }
          const forSaleWorks = forsale_artworks_count ? forsale_artworks_count + ' for sale' : null;
          return (forSaleWorks && totalWorks) ? (totalWorks + ', ' + forSaleWorks) : totalWorks;
        },
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
            description: 'The number of Shows to return',
            defaultValue: 5,
          },
        },
        type: new GraphQLList(Show.type),
        resolve: ({ id }, options) => {
          return Promise.all([
            // Highest tier solo institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: true,
              is_reference: true,
              highest_tier: true,
              solo_show: true,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Highest tier solo gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: false,
              is_reference: true,
              highest_tier: true,
              solo_show: true,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Highest tier group institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: true,
              is_reference: true,
              highest_tier: true,
              solo_show: false,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Highest tier group gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: false,
              is_reference: true,
              highest_tier: true,
              solo_show: false,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Lower tier solo institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: true,
              is_reference: true,
              highest_tier: false,
              solo_show: true,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Lower tier solo gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: false,
              is_reference: true,
              highest_tier: false,
              solo_show: true,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Lower tier group institutional shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: true,
              is_reference: true,
              highest_tier: false,
              solo_show: false,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Lower tier group gallery shows
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              is_institution: false,
              highest_tier: false,
              is_reference: true,
              solo_show: false,
              at_a_fair: false,
              visible_to_public: false,
              size: options.size,
            }),
            // Fair booths
            gravity('related/shows', {
              artist_id: id,
              sort: '-end_at',
              at_a_fair: true,
              visible_to_public: false,
              size: options.size,
            }),
          ]).then(allShows => take(concat(...allShows), options.size));
        },
      },

      partner_shows: Object.assign({
        type: new GraphQLList(PartnerShow.type),
        deprecationReason: 'Prefer to use shows attribute',
      }, ShowField),
      shows: Object.assign({
        type: new GraphQLList(Show.type),
      }, ShowField),

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
