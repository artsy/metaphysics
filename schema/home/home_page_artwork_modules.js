import gravity from '../../lib/loaders/gravity';
import {
  keys,
  map,
  filter,
  slice,
  findIndex,
  set,
} from 'lodash';
import {
  GraphQLList,
  GraphQLInt,
} from 'graphql';
import HomePageArtworkModule from './home_page_artwork_module';
import loggedOutModules from './logged_out_modules';
import addGenericGenes from './add_generic_genes';
import { featuredFair, featuredAuction, relatedArtist } from './fetch';

const filterModules = (modules, max_rails) => {
  return slice(
    addGenericGenes(filter(modules, ['display', true])),
  0, max_rails);
};

export function createHomePageArtworkModules(singularModule) {
  return {
    type: new GraphQLList(singularModule.type),
    description: 'Artwork modules to show on the home screen',
    args: {
      max_rails: {
        type: GraphQLInt,
        description: 'Maximum number of modules to return',
        defaultValue: 8,
      },
    },
    resolve: (root, { max_rails }, { rootValue: { accessToken } }) => {
      // if user is logged in, get their modules
      if (accessToken) {
        return gravity.with(accessToken)('me/modules').then((response) => {
          const modules = map(keys(response), (key) => {
            const display = key === 'followed_artists' ? true : response[key];
            return { key, display };
          });
          const filteredModules = filterModules(modules, max_rails);
          const relatedArtistIndex = findIndex(filteredModules, ['key', 'related_artists']);
          if (relatedArtistIndex) {
            return Promise.all([relatedArtist(accessToken)]).then(([{ followed_artist, related_artist }]) => {
              const relatedArtistModuleParams = {
                followed_artist_id: followed_artist.id,
                related_artist_id: related_artist.id,
              };
              return set(filteredModules, `[${relatedArtistIndex}].params`, relatedArtistModuleParams);
            });
          }
          return filteredModules;
        });
      }
      // otherwise, get the generic set of modules
      return Promise.all([
        featuredAuction(),
        featuredFair(),
      ]).then(([auction, fair]) => {
        const modules = loggedOutModules(auction, fair);
        return filterModules(modules, max_rails);
      });
    },
  };
}

const HomePageArtworkModules = createHomePageArtworkModules(HomePageArtworkModule);
export default HomePageArtworkModules;
