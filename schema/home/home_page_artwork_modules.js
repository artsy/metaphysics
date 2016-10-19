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
import { featuredFair, featuredAuction, relatedArtist, followedGenes } from './fetch';

const filterModules = (modules, max_rails) => {
  const allModules = addGenericGenes(filter(modules, ['display', true]));
  return max_rails < 0 ? allModules : slice(allModules, 0, max_rails);
};

const addFollowedGenes = (accessToken, modules, max_followed_gene_rails) => {
  const followedGeneIndex = findIndex(modules, { key: 'genes' });
  if (followedGeneIndex && max_followed_gene_rails !== 1) {
    // 100 is the max that Gravity will return per page.
    const size = max_followed_gene_rails < 0 ? 100 : max_followed_gene_rails;
    return followedGenes(accessToken, size).then(follows => {
      const blueprint = modules[followedGeneIndex];
      const genes = map(follows, ({ gene: { id, name } }) => {
        return Object.assign({ params: { id, name } }, blueprint);
      });
      const copy = modules.slice(0);
      const args = [followedGeneIndex, 1].concat(genes);
      Array.prototype.splice.apply(copy, args);
      return copy;
    });
  }
  return Promise.resolve(modules);
};

const HomePageArtworkModules = {
  type: new GraphQLList(HomePageArtworkModuleType),
  description: 'Artwork modules to show on the home screen',
  args: {
    max_rails: {
      type: GraphQLInt,
      description: 'Maximum number of modules to return, disable limit with a negative number',
      defaultValue: 8,
    },
    max_followed_gene_rails: {
      type: GraphQLInt,
      description: 'Maximum number of followed genes to return, disable with a negative number',
      defaultValue: 1,
    },
  },
  resolve: (
    root,
    { max_rails, max_followed_gene_rails },
    request,
    { rootValue: { accessToken, userID } }
  ) => {
    // If user is logged in, get their specific modules
    if (accessToken) {
      return gravity.with(accessToken)('me/modules').then((response) => {
        const modulesToDisplay = map(keys(response), (key) => ({ key, display: response[key] }));
        return addFollowedGenes(accessToken, modulesToDisplay, max_followed_gene_rails)
          .then(modules => {
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
