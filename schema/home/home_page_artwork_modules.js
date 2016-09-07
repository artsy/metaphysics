import gravity from '../../lib/loaders/gravity';
import {
  keys,
  map,
  filter,
  slice,
  findIndex,
  set,
  without,
  find,
} from 'lodash';
import {
  GraphQLList,
  GraphQLInt,
} from 'graphql';
import { HomePageArtworkModuleType } from './home_page_artwork_module';
import loggedOutModules from './logged_out_modules';
import addGenericGenes from './add_generic_genes';
import { featuredFair, featuredAuction, relatedArtist } from './fetch';

const filterModules = (modules, max_rails) => {
  return slice(
    addGenericGenes(filter(modules, ['display', true])),
  0, max_rails);
};

const HomePageArtworkModules = {
  type: new GraphQLList(HomePageArtworkModuleType),
  description: 'Artwork modules to show on the home screen',
  args: {
    max_rails: {
      type: GraphQLInt,
      description: 'Maximum number of modules to return',
      defaultValue: 8,
    },
  },
  resolve: (root, { max_rails }, { rootValue: { accessToken, userID } }) => {
    // If user is logged in, get their specific modules
    if (accessToken) {
      return gravity.with(accessToken)('me/modules').then((response) => {
        const modules = map(keys(response), (key) => {
          // We always want to show the followed_artists rail no matter what
          const display = key === 'followed_artists' ? true : response[key];
          return { key, display };
        });
        const filteredModules = filterModules(modules, max_rails);

        // For the related artists rail, we need to fetch a random
        // set of followed artist + related artist initially
        // and pass it along so that any placeholder titles are consistent
        const relatedArtistIndex = findIndex(filteredModules, { key: 'related_artists' });

        if (relatedArtistIndex > -1) {
          return Promise.resolve(relatedArtist(accessToken, userID))
          .then((artistPair) => {
            if (artistPair) {
              const { artist, sim_artist } = artistPair;

              const relatedArtistModuleParams = {
                followed_artist_id: sim_artist.id,
                related_artist_id: artist.id,
              };
              return set(
                filteredModules,
                `[${relatedArtistIndex}].params`,
                relatedArtistModuleParams
              );
            }
            // if we don't find an artist pair,
            // remove the related artist rail
            return without(
              filteredModules,
              find(filteredModules, { key: 'related_artists' })
            );
          });
        }
        return filteredModules;
      });
    }

    // Otherwise, get the generic set of modules
    return Promise.all([
      featuredAuction(),
      featuredFair(),
    ]).then(([auction, fair]) => {
      const modules = loggedOutModules(auction, fair);
      return filterModules(modules, max_rails);
    });
  },
};

export default HomePageArtworkModules;
