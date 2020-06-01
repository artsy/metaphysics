import { GraphQLFieldConfig, GraphQLInt, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  filter,
  find,
  findIndex,
  keys,
  map,
  remove,
  set,
  slice,
  without,
} from "lodash"
import addGenericGenes from "./add_generic_genes"
import {
  featuredAuction,
  featuredFair,
  followedGenes,
  relatedArtists,
} from "./fetch"
import { HomePageArtworkModuleType } from "./home_page_artwork_module"
import loggedOutModules from "./logged_out_modules"
import { LoadersWithAuthentication } from "lib/loaders/loaders_with_authentication"
import {
  HomePageArtworkModuleTypeKeys,
  HomePageArtworkModuleDetails,
  HomePageArtworkModuleTypes,
} from "./types"

const filterModules = (modules, max_rails) => {
  const allModules = addGenericGenes(filter(modules, ["display", true]))
  return max_rails < 0 ? allModules : slice(allModules, 0, max_rails)
}

const addFollowedGenes = (
  followedGenesLoader: LoadersWithAuthentication["followedGenesLoader"],
  modules: HomePageArtworkModuleDetails[],
  max_followed_gene_rails: number
): Promise<HomePageArtworkModuleDetails[]> => {
  const followedGeneIndex = findIndex(modules, { key: "genes" })
  if (followedGeneIndex && max_followed_gene_rails >= 1) {
    // 100 is the max that Gravity will return per page.
    const size = max_followed_gene_rails < 0 ? 100 : max_followed_gene_rails
    return followedGenes(followedGenesLoader, size).then((results) => {
      const blueprint = modules[followedGeneIndex]
      const genes = map(results, ({ gene }) => {
        return { ...blueprint, params: { id: gene.id, gene } }
      })
      const copy = modules.slice(0)
      copy.splice(followedGeneIndex, 1, ...genes)
      return copy
    })
  }
  return Promise.resolve(modules)
}

const reorderModules = (
  modules: HomePageArtworkModuleDetails[],
  preferredOrder: Array<HomePageArtworkModuleTypeKeys>
) => {
  if (!preferredOrder) {
    return modules
  }
  const unordered = modules.slice(0)
  const reordered: HomePageArtworkModuleDetails[] = []
  preferredOrder.forEach((key) => {
    remove(unordered, (mod: any) => {
      if (mod.key === key) {
        // FIXME: Argument of type 'any' is not assignable to parameter of type 'never'.
        // @ts-ignore
        reordered.push(mod)
        return true
      }
    })
  })
  return reordered.concat(unordered)
}

const HomePageArtworkModules: GraphQLFieldConfig<void, ResolverContext> = {
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
    _root,
    { max_rails, max_followed_gene_rails, order, exclude },
    {
      followedGenesLoader,
      homepageModulesLoader,
      fairsLoader,
      salesLoader,
      suggestedSimilarArtistsLoader,
    }
  ): Promise<HomePageArtworkModuleDetails[]> => {
    // If user is logged in, get their specific modules
    if (homepageModulesLoader && followedGenesLoader) {
      return homepageModulesLoader().then((response) => {
        const keysToDisplay = without(keys(response), ...exclude)
        const modulesToDisplay = map(keysToDisplay, (key) => ({
          key,
          display: response[key],
        }))
        return addFollowedGenes(
          followedGenesLoader,
          modulesToDisplay,
          max_followed_gene_rails
        ).then((allModulesToDisplay) => {
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
              (artistPairs) => {
                // relatedArtist now returns 2 random artist pairs
                // we will use one for the related_artist rail and one for
                // the followed_artist rail
                if (artistPairs && artistPairs.length) {
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

                  const relatedArtistModuleParams = {
                    followed_artist_id: artistPairs[0].sim_artist.id,
                    related_artist_id: artistPairs[0].artist.id,
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
