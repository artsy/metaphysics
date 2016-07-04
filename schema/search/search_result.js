import _ from 'lodash';
import url from 'url';
import { classify } from '../../lib/helpers';
import routing from '../../lib/routing';
import gravity from '../../lib/loaders/gravity';
import Image from '../image';
import SearchEntityType from './search_entity';
import {
  GraphQLID,
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

export const parseOgType = ({ pagemap }) => {
  const ogType = _.get(pagemap, ['metatags', '0', 'og:type'], '');
  const cleanType = ogType.split(':')[1] || ogType;
  if (cleanType === 'exhibition') return 'PartnerShow';
  return classify(cleanType);
};

export const parseId = ({ link }) => {
  const urlComponents = _.rest(url.parse(link).path.split('/'));
  const supportedRouteTypes = ['artist', 'artwork', 'show'];

  const first = _.first(urlComponents);
  const last = _.last(urlComponents);

  return _.some(supportedRouteTypes.map(type => first === type)) ? last : first;
};

const SearchResultType = new GraphQLObjectType({
  name: 'SearchResult',
  fields: () => ({
    id: {
      type: GraphQLID,
      resolve: parseId,
    },
    title: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ link }) => url.parse(link).path,
    },
    snippet: {
      type: GraphQLString,
    },
    image: {
      type: Image.type,
      resolve: ({ pagemap }) => {
        // Should attempt to get the entity's image rather than
        // using Google's, as it is often inaccurate.
        const image = _.first(_.get(pagemap, 'cse_image'));
        return Image.resolve({
          image_url: image.src,
          original_height: image.height,
          original_width: image.width,
        });
      },
    },
    type: {
      type: GraphQLString,
      resolve: parseOgType,
    },
    entity: {
      type: SearchEntityType,
      resolve: (searchResult) => {
        const id = parseId(searchResult);
        const type = parseOgType(searchResult);
        return gravity(routing(type, id).api)
          .then(response => {
            response.type = type; // eslint-disable-line no-param-reassign
            return response;
          });
      },
    },
  }),
});

const SearchResult = {
  type: SearchResultType,
  description: 'A Search Result',
};

export default SearchResult;
