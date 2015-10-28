import _ from 'lodash';
import qs from 'querystring';

import artsy from '../lib/artsy';
import Artist from './artist';
import Image from './image';
import Sale from './sale';

import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt
} from 'graphql';

import artsyLoader from '../lib/artsy_loader';

export let ArtworkPredicates = {
  is_contactable: (artwork, relatedSales) => {
    return artwork.forsale && !_.isEmpty(artwork.partner) && !artwork.acquireable && !relatedSales.length
  }
}

let fetchRelatedSales = ({ id }, options) => {
  options = qs.stringify(_.defaults(options, {
    size: 1,
    active: true,
    'artwork[]': id
  }));
  return artsyLoader(`related/sales?${options}`);
};

let ArtworkType = new GraphQLObjectType({
  name: 'Artwork',
  fields: () => ({
    id: {
      type: GraphQLString
    },
    href: {
      type: GraphQLString,
      resolve: (artwork) => `/artwork/${artwork.id}`
    },
    title: {
      type: GraphQLString
    },
    category: {
      type: GraphQLString
    },
    medium: {
      type: GraphQLString
    },
    date: {
      type: GraphQLString
    },
    is_contactable: {
      type: GraphQLBoolean,
      description: 'Are we able to display a contact form on artwork pages?',
      resolve: (artwork) => {
        return new Promise((resolve) => {
          fetchRelatedSales({id: artwork.id }, {})
            .then((relatedSales) => {
              resolve(ArtworkPredicates.is_contactable(artwork, relatedSales))
            })
        })
      }
    },
    artist: {
      type: Artist.type,
      resolve: ({ artist }) => artsyLoader(`artist/${artist.id}`)
    },
    dimensions: {
      type: new GraphQLObjectType({
        name: 'dimensions',
        fields: {
          in: { type: GraphQLString },
          cm: { type: GraphQLString }
        }
      })
    },
    images: {
      type: new GraphQLList(Image.type),
      args: {
        size: {
          type: GraphQLInt
        }
      },
      resolve: ({ images }, { size }) => {
        return size ? _.take(images, size) : images;
      }
    },
    sales: {
      type: new GraphQLList(Sale.type),
      resolve: fetchRelatedSales
    }
  })
});

let Artwork = {
  type: ArtworkType,
  description: 'An Artwork',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Artwork'
    }
  },
  resolve: (root, { id }) => artsyLoader(`artwork/${id}`)
};

export default Artwork;
