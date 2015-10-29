import gravity from '../lib/loaders/gravity';
import Artist from './artist';
import Image from './image';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt
} from 'graphql';

let PartnerShowType = new GraphQLObjectType({
  name: 'PartnerShow',
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
    images: {
      type: new GraphQLList(Image.type),
      args: {
        size: {
          type: GraphQLInt,
          description: 'Number of images to return'
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
