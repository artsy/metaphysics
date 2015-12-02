import _ from 'lodash';
import url from 'url';
import routing from '../../lib/routing';
import gravity from '../../lib/loaders/gravity';
import Image from '../image';
import SearchEntityType from './search_entity';
import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

let classify = _.flow(_.camelCase, _.capitalize);

export let parseOgType = ({ pagemap }) => {
  let ogType = _.get(pagemap, ['metatags', '0', 'og:type'], '');
  let cleanType = ogType.split(':')[1] || ogType;
  if (cleanType === 'exhibition') {
    return 'PartnerShow';
  } else {
    return classify(cleanType);
  }
};

export let parseId = ({ link }) => {
  let urlComponents = _.rest(url.parse(link).path.split('/'));
  let supportedRouteTypes = ['artist', 'artwork', 'show'];

  let first = _.first(urlComponents);
  let last = _.last(urlComponents);

  return _.some(supportedRouteTypes.map(type => first === type)) ? last : first;
}

let SearchResultType = new GraphQLObjectType({
  name: 'SearchResult',
  fields: () => ({
    id: {
      type: GraphQLString,
      resolve: parseId
    },
    title: {
      type: GraphQLString
    },
    href: {
      type: GraphQLString,
      resolve: ({ link }) => url.parse(link).path
    },
    snippet: {
      type: GraphQLString
    },
    image: {
      type: Image.type,
      resolve: ({ pagemap }) => {
        // Should attempt to get the entity's image rather than
        // using Google's, as it is often inaccurate.
        let image = _.first(_.get(pagemap, 'cse_image'));
        return {
          image_url: image.src,
          original_height: image.height,
          original_width: image.width
        };
      }
    },
    type: {
      type: GraphQLString,
      resolve: parseOgType
    },
    entity: {
      type: SearchEntityType,
      resolve: (searchResult) => {
        let id = parseId(searchResult);
        let type = parseOgType(searchResult);
        return gravity(routing(type, id).api)
          .then(response => {
            response.type = type;
            return response;
          });
      }
    }
  })
});

let SearchResult = {
  type: SearchResultType,
  description: 'A Search Result'
};

export default SearchResult;
