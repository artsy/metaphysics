import moment from 'moment';
import {
  isExisty,
  exclude,
} from '../lib/helpers';
import {
  find,
  has,
} from 'lodash';
import gravity from '../lib/loaders/gravity';
import total from '../lib/loaders/total';
import numeral from './fields/numeral';
import { exhibitionPeriod, exhibitionStatus } from '../lib/date';
import cached from './fields/cached';
import date from './fields/date';
import { markdown } from './fields/markdown';
import Artist from './artist';
import Partner from './partner';
import Fair from './fair';
import Artwork from './artwork';
import Location from './location';
import Image, { getDefault } from './image';
import PartnerShowEventType from './partner_show_event';
import { GravityIDFields, NodeInterface } from './object_identification';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';

const kind = ({ artists, fair }) => {
  if (isExisty(fair)) return 'fair';
  if (artists.length > 1) return 'group';
  if (artists.length === 1) return 'solo';
};

const PartnerShowType = new GraphQLObjectType({
  name: 'PartnerShow',
  deprecationReason: 'Prefer to use Show schema',
  interfaces: [NodeInterface],
  isTypeOf: (obj) => has(obj, 'partner') && has(obj, 'display_on_partner_profile'),
  fields: () => ({
    ...GravityIDFields,
    cached,
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `/show/${id}`,
    },
    kind: {
      type: GraphQLString,
      resolve: (show) => {
        if (show.artists) return kind(show);
        return gravity(`partner/${show.partner.id}/show/${show.id}`).then(kind);
      },
    },
    name: {
      type: GraphQLString,
      description: 'The exhibition title',
    },
    description: {
      type: GraphQLString,
    },
    type: {
      type: GraphQLString,
      resolve: ({ fair }) =>
        isExisty(fair) ? 'Fair Booth' : 'Show',
    },
    displayable: {
      type: GraphQLBoolean,
      deprecationReason: 'Prefix Boolean returning fields with `is_`',
    },
    is_active: {
      type: GraphQLBoolean,
      description: 'Gravity doesn’t expose the `active` flag. Temporarily re-state its logic.',
      resolve: ({ start_at, end_at }) => {
        const start = moment.utc(start_at).subtract(7, 'days');
        const end = moment.utc(end_at).add(7, 'days');
        return moment.utc().isBetween(start, end);
      },
    },
    is_displayable: {
      type: GraphQLBoolean,
      resolve: ({ displayable }) => displayable,
    },
    is_fair_booth: {
      type: GraphQLBoolean,
      resolve: ({ fair }) => isExisty(fair),
    },
    press_release: markdown(),
    start_at: date,
    end_at: date,
    created_at: date,
    exhibition_period: {
      type: GraphQLString,
      description: 'A formatted description of the start to end dates',
      resolve: ({ start_at, end_at }) => exhibitionPeriod(start_at, end_at),
    },
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: ({ artists }) => artists,
    },
    partner: {
      type: Partner.type,
      resolve: ({ partner }) => partner,
    },
    fair: {
      type: Fair.type,
      resolve: ({ fair }) => fair,
    },
    location: {
      type: Location.type,
      resolve: ({ location, fair_location }) => location || fair_location,
    },
    status: {
      type: GraphQLString,
    },
    status_update: {
      type: GraphQLString,
      description: 'A formatted update on upcoming status changes',
      args: {
        max_days: {
          type: GraphQLInt,
          description: 'Before this many days no update will be generated',
        },
      },
      resolve: ({ start_at, end_at }, options) =>
        exhibitionStatus(start_at, end_at, options.max_days),
    },
    events: {
      type: new GraphQLList(PartnerShowEventType),
      resolve: ({ partner, id }) =>
        // Gravity redirects from /api/v1/show/:id => /api/v1/partner/:partner_id/show/:show_id
        // this creates issues where events will remain cached. Fetch the non-redirected
        // route to circumvent this
        gravity(`partner/${partner.id}/show/${id}`)
          .then(({ events }) => events),
    },
    counts: {
      type: new GraphQLObjectType({
        name: 'PartnerShowCounts',
        fields: {
          artworks: {
            type: GraphQLInt,
            args: {
              artist_id: {
                type: GraphQLString,
                description: 'The slug or ID of an artist in the show.',
              },
            },
            resolve: ({ id, partner }, options) => {
              return total(`partner/${partner.id}/show/${id}/artworks`, options);
            },
          },
          eligible_artworks: numeral(({ eligible_artworks_count }) =>
            eligible_artworks_count),
        },
      }),
      resolve: (partner_show) => partner_show,
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      args: {
        size: {
          type: GraphQLInt,
          description: 'Number of artworks to return',
          defaultValue: 25,
        },
        published: {
          type: GraphQLBoolean,
          defaultValue: true,
        },
        page: {
          type: GraphQLInt,
          defaultValue: 1,
        },
        all: {
          type: GraphQLBoolean,
          default: false,
        },
        for_sale: {
          type: GraphQLBoolean,
          default: false,
        },
        exclude: {
          type: new GraphQLList(GraphQLString),
          description: 'List of artwork IDs to exclude from the response (irrespective of size)',
        },
      },
      resolve: (show, options) => {
        const path = `partner/${show.partner.id}/show/${show.id}/artworks`;

        let fetch = null;

        if (options.all) {
          fetch = gravity.all(path, options);
        } else {
          fetch = gravity(path, options);
        }

        return fetch
          .then(exclude(options.exclude, 'id'));
      },
    },
    meta_image: {
      type: Image.type,
      resolve: ({ id, partner, image_versions, image_url }) => {
        if (image_versions && image_versions.length && image_url) {
          return Image.resolve({ image_versions, image_url });
        }

        return gravity(`partner/${partner.id}/show/${id}/artworks`, {
          published: true,
        })
          .then(artworks => {
            Image.resolve(getDefault(find(artworks, { can_share_image: true })));
          });
      },
    },
    cover_image: {
      type: Image.type,
      resolve: ({ id, partner, image_versions, image_url }) => {
        if (image_versions && image_versions.length && image_url) {
          return Image.resolve({ image_versions, image_url });
        }

        return partner && gravity(`partner/${partner.id}/show/${id}/artworks`, {
          size: 1,
          published: true,
        }).then(artworks => {
          const artwork = artworks[0];
          return artwork && Image.resolve(getDefault(artwork.images));
        });
      },
    },
    images: {
      type: new GraphQLList(Image.type),
      args: {
        size: {
          type: GraphQLInt,
          description: 'Number of images to return',
        },
        default: {
          type: GraphQLBoolean,
          description: 'Pass true/false to include cover or not',
        },
        page: {
          type: GraphQLInt,
        },
      },
      resolve: ({ id }, options) => {
        return gravity(`partner_show/${id}/images`, options)
          .then(Image.resolve);
      },
    },
  }),
});

const PartnerShow = {
  type: PartnerShowType,
  description: 'A Partner Show',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the PartnerShow',
    },
  },
  resolve: (root, { id }) => {
    return gravity(`show/${id}`)
      .then(show => {
        if (!show.displayable) return new Error('Show Not Found');
        return show;
      });
  },
};

export default PartnerShow;
