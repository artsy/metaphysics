import _ from 'lodash';
import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import Artist from './artist';
import Partner from './partner';
import Fair from './fair';
import Artwork from './artwork';
import Location from './location';
import Image from './image';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean
} from 'graphql';

let PartnerShowType = new GraphQLObjectType({
  name: 'PartnerShow',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    href: {
      type: GraphQLString,
      resolve: (partnerShow) => `/show/${partnerShow.id}`
    },
    name: {
      type: GraphQLString,
      description: 'The exhibition title'
    },
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: ({ artists }) => artists
    },
    partner: {
      type: Partner.type,
      resolve: (show) => {
        return show.partner
      }
    },
    fair: {
      type: Fair.type,
      resolve: (show) => {
        return show.fair
      }
    },
    location: {
      type: Location.type,
      resolve: (show) => {
        if (show.location != null) {
          return show.location
        }
        else if (show.fair_location != null) {
          return show.fair_location
        }
      }
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      args: {
        size: {
          type: GraphQLInt,
          description: 'Number of artworks to return'
        }
      },
      resolve: (show, options) => gravity(`partner/${show.partner.id}/show/${show.id}/artworks`, _.defaults(options, {
        published: true
      }))
    },
    images: {
      type: new GraphQLList(Image.type),
      args: {
        size: {
          type: GraphQLInt,
          description: 'Number of images to return'
        },
        default: {
          type: GraphQLBoolean,
          description: 'Pass true/false to include cover or not'
        }
      },
      resolve: ({ id }, options) => gravity(`partner_show/${id}/images`, options)
    }
  })
});

let PartnerShow = {
  type: PartnerShowType,
  description: 'A Partner Show',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the PartnerShow'
    }
  },
  resolve: (root, { id }) => {
    return gravity(`show/${id}`)
  }
};

export default PartnerShow;
