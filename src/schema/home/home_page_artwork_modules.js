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
} from "lodash"
import { GraphQLEnumType, GraphQLInt, GraphQLList } from "graphql"
import { HomePageArtworkModuleType } from "./home_page_artwork_module"
import loggedOutModules from "./logged_out_modules"
import addGenericGenes from "./add_generic_genes"
import {
  featuredFair,
  featuredAuction,
  relatedArtists,
  followedGenes,
} from "./fetch"

const filterModules = (modules, max_rails) => {
  const allModules = addGenericGenes(filter(modules, ["display", true]))
  return max_rails < 0 ? allModules : slice(allModules, 0, max_rails)
}

const addFollowedGenes = (
  followedGenesLoader,
  modules,
  max_followed_gene_rails
) => {
  const followedGeneIndex = findIndex(modules, { key: "genes" })
  if (followedGeneIndex && max_followed_gene_rails >= 1) {
    // 100 is the max that Gravity will return per page.
    const size = max_followed_gene_rails < 0 ? 100 : max_followed_gene_rails
    return followedGenes(followedGenesLoader, size).then(results => {
      const blueprint = modules[followedGeneIndex]
      const genes = map(results, ({ gene }) => {
        return Object.assign({ params: { id: gene.id, gene } }, blueprint)
      })
      const copy = modules.slice(0)
      const args = [followedGeneIndex, 1].concat(genes)
      Array.prototype.splice.apply(copy, args)
      return copy
    })
  }
  return Promise.resolve(modules)
}

const reorderModules = (modules, preferredOrder) => {
  if (!preferredOrder) {
    return modules
  }
  const unordered = modules.slice(0)
  const reordered = []
  preferredOrder.forEach(key => {
    remove(unordered, mod => {
      if (mod.key === key) {
        reordered.push(mod)
        return true
      }
    })
  })
  return reordered.concat(unordered)
}

const HomePageArtworkModuleTypes = new GraphQLEnumType({
  name: "HomePageArtworkModuleTypes",
  values: {
    ACTIVE_BIDS: {
      value: "active_bids",
    },
    CURRENT_FAIRS: {
      value: "current_fairs",
    },
    FOLLOWED_ARTIST: {
      value: "followed_artist",
    },
    FOLLOWED_ARTISTS: {
      value: "followed_artists",
    },
    FOLLOWED_GALLERIES: {
      value: "followed_galleries",
    },
    FOLLOWED_GENES: {
      value: "genes",
    },
    GENERIC_GENES: {
      value: "generic_gene",
    },
    LIVE_AUCTIONS: {
      value: "live_auctions",
    },
    RECOMMENDED_WORKS: {
      value: "recommended_works",
    },
    RELATED_ARTISTS: {
      value: "related_artists",
    },
    SAVED_WORKS: {
      value: "saved_works",
    },
    RECENTLY_VIEWED_WORKS: {
      value: "recently_viewed_works",
    },
    SIMILAR_TO_RECENTLY_VIEWED: {
      value: "similar_to_recently_viewed",
    },
    SIMILAR_TO_SAVED_WORKS: {
      value: "similar_to_saved_works",
    },
  },
})

const HomePageArtworkModules = {
  type: new GraphQLList(HomePageArtworkModuleType),
  description: "Artwork modules to show on the home screen",
  args: {
    max_followed_gene_rails: {
      type: GraphQLInt,
      description:
        "Maximum number of followed genes to return, disable with a negative number",
      defaultValue: 1,
    },
    max_rails: {
      type: GraphQLInt,
      description:
        "Maximum number of modules to return, disable limit with a negative number",
      defaultValue: 8,
    },
    order: {
      type: new GraphQLList(HomePageArtworkModuleTypes),
      description:
        "The preferred order of modules, defaults to order returned by Gravity",
    },
    exclude: {
      type: new GraphQLList(HomePageArtworkModuleTypes),
      defaultValue: [],
      description: "Exclude certain modules",
    },
  },
  resolve: (
    root,
    { max_rails, max_followed_gene_rails, order, exclude },
    request,
    {
      rootValue: {
        accessToken,
        followedGenesLoader,
        homepageModulesLoader,
        fairsLoader,
        salesLoader,
        suggestedSimilarArtistsLoader,
      },
    }
  ) => {
    // If user is logged in, get their specific modules
    if (accessToken) {
      return homepageModulesLoader().then(response => {
        const keysToDisplay = without(keys(response), ...exclude)
        const modulesToDisplay = map(keysToDisplay, key => ({
          key,
          display: response[key],
        }))
        return addFollowedGenes(
          followedGenesLoader,
          modulesToDisplay,
          max_followed_gene_rails
        ).then(allModulesToDisplay => {
          let modules = allModulesToDisplay

          modules = filterModules(modules, max_rails)
          modules = reorderModules(modules, order)

          // For the related artists rail, we need to fetch a random
          // set of followed artist + related artist initially
          // and pass it along so that any placeholder titles are consistent
          let relatedArtistIndex = findIndex(modules, {
            key: "related_artists",
          })

          if (relatedArtistIndex > -1) {
            return relatedArtists(suggestedSimilarArtistsLoader).then(
              artistPairs => {
                // relatedArtist now returns 2 random artist pairs
                // we will use one for the related_artist rail and one for
                // the followed_artist rail
                if (artistPairs && artistPairs.length) {
                  const { artist, sim_artist } = artistPairs[0]

                  const relatedArtistModuleParams = {
                    followed_artist_id: sim_artist.id,
                    related_artist_id: artist.id,
                  }

                  if (artistPairs[1]) {
                    modules.splice(relatedArtistIndex, 0, {
                      key: "followed_artist",
                      display: true,
                      params: {
                        followed_artist_id: artistPairs[1].sim_artist.id,
                      },
                    })
                    relatedArtistIndex++
                  }

                  return set(
                    modules,
                    `[${relatedArtistIndex}].params`,
                    relatedArtistModuleParams
                  )
                }
                // if we don't find an artist pair,
                // remove the related artist rail
                return without(
                  modules,
                  find(modules, { key: "related_artists" })
                )
              }
            )
          }
          return modules
        })
      })
    }
    // Otherwise, get the generic set of modules
    return Promise.all([
      featuredAuction(salesLoader),
      featuredFair(fairsLoader),
    ]).then(([auction, fair]) => {
      const modules = loggedOutModules(auction, fair)
      return filterModules(modules, max_rails)
    })
  },
}

export default HomePageArtworkModules
