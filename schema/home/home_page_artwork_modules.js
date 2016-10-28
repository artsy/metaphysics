/* @flow */

import {
  filter,
  find,
  findIndex,
  keys,
  map,
  remove,
  slice,
  set,
  without,
} from 'lodash';
import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
} from 'graphql';

import { HomePageArtworkModuleType } from './home_page_artwork_module';
import loggedOutModules from './logged_out_modules';
import addGenericGenes from './add_generic_genes';

import { featuredFair, featuredAuction, relatedArtist, followedGenes } from './fetch';
import gravity from '../../lib/loaders/gravity';

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
      const genes = map(follows, ({ gene }) => {
        return Object.assign({ params: { id: gene.id, gene } }, blueprint);
      });
      const copy = modules.slice(0);
      const args = [followedGeneIndex, 1].concat(genes);
      Array.prototype.splice.apply(copy, args);
      return copy;
    });
  }
  return Promise.resolve(modules);
};

const reorderModules = (modules, preferredOrder) => {
  if (!preferredOrder) {
    return modules;
  }
  const unordered = modules.slice(0);
  const reordered = [];
  preferredOrder.forEach(key => {
    remove(unordered, mod => {
      if (mod.key === key) {
        reordered.push(mod);
        return true;
      }
    });
  });
  return reordered.concat(unordered);
};

const HomePageArtworkModuleTypes = new GraphQLEnumType({
  name: 'HomePageArtworkModuleTypes',
  values: {
    ACTIVE_BIDS: {
      value: 'active_bids',
    },
    FOLLOWED_ARTISTS: {
      value: 'followed_artists',
    },
    FOLLOWED_GALLERIES: {
      value: 'followed_galleries',
    },
    SAVED_WORKS: {
      value: 'saved_works',
    },
    RECOMMENDED_WORKS: {
      value: 'recommended_works',
    },
    LIVE_AUCTIONS: {
      value: 'live_auctions',
    },
    CURRENT_FAIRS: {
      value: 'current_fairs',
    },
    RELATED_ARTISTS: {
      value: 'related_artists',
    },
    FOLLOWED_GENES: {
      value: 'genes',
    },
    GENERIC_GENES: {
      value: 'generic_gene',
    },
  },
});

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
    order: {
      type: new GraphQLList(HomePageArtworkModuleTypes),
      description: 'The preferred order of modules, defaults to order returned by Gravity',
    },
  },
  resolve: (
    root,
    { max_rails, max_followed_gene_rails, order },
    request,
    { rootValue: { accessToken, userID } }
  ) => {
    // If user is logged in, get their specific modules
    if (accessToken) {
      return gravity.with(accessToken)('me/modules').then((response) => {
        const modulesToDisplay = map(keys(response), (key) => ({ key, display: response[key] }));
        return addFollowedGenes(accessToken, modulesToDisplay, max_followed_gene_rails)
          .then(allModulesToDisplay => {
            let modules = allModulesToDisplay;

            modules = filterModules(modules, max_rails);
            modules = reorderModules(modules, order);

            // For the related artists rail, we need to fetch a random
            // set of followed artist + related artist initially
            // and pass it along so that any placeholder titles are consistent
            const relatedArtistIndex = findIndex(modules, { key: 'related_artists' });

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
                      modules,
                      `[${relatedArtistIndex}].params`,
                      relatedArtistModuleParams
                    );
                  }
                  // if we don't find an artist pair,
                  // remove the related artist rail
                  return without(
                    modules,
                    find(modules, { key: 'related_artists' })
                  );
                });
            }
            return modules;
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
