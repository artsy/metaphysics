import { ResolverContext } from "types/graphql"
import { GraphQLEnumType } from "graphql"

// This is defined as an object so we can use TS’ keyof keyword to also get a
// list of available module types.
export const HomePageArtworkModuleTypeValues = {
  active_bids: null,
  current_fairs: null,
  followed_artist: null,
  followed_artists: null,
  followed_galleries: null,
  live_auctions: null,
  popular_artists: null,
  recommended_works: null,
  related_artists: null,
  saved_works: null,
  recently_viewed_works: null,
  similar_to_recently_viewed: null,
  similar_to_saved_works: null,
}

export const HomePageArtworkModuleTypes = new GraphQLEnumType({
  name: "HomePageArtworkModuleTypes",
  values: Object.keys(HomePageArtworkModuleTypeValues).reduce(
    (acc, type) => ({ ...acc, [type.toUpperCase()]: { value: type } }),
    {
      // These need manual handling because of inconsistent naming.
      FOLLOWED_GENES: {
        value: "genes",
      },
      GENERIC_GENES: {
        value: "generic_gene",
      },
    }
  ),
})

export type HomePageArtworkModuleTypeKeys =
  | "genes"
  | "generic_gene"
  | keyof typeof HomePageArtworkModuleTypeValues

interface FollowedArtistArtworkModuleParams {
  followed_artist_id: string
}

interface RelatedArtistArtworkModuleParams
  extends FollowedArtistArtworkModuleParams {
  related_artist_id: string
}

interface FollowedGeneArtworkModuleParams {
  id: string
  gene: { name: string } // TODO: This should be moved to the gravity loader
}

export interface GenericGeneArtworkModuleParams {
  id: string
  gene_id: string
  title: string
  medium?: string
  price_range?: string
}

export interface HomePageArtworkModuleDetails {
  key: HomePageArtworkModuleTypeKeys
  display: boolean
  params?:
    | FollowedArtistArtworkModuleParams
    | RelatedArtistArtworkModuleParams
    | GenericGeneArtworkModuleParams
    | FollowedGeneArtworkModuleParams
}

export function isFollowedArtistArtworkModuleParams(
  params: HomePageArtworkModuleDetails["params"]
): params is FollowedArtistArtworkModuleParams {
  return !!params && params.hasOwnProperty("followed_artist_id")
}

export function isRelatedArtistArtworkModuleParams(
  params: HomePageArtworkModuleDetails["params"]
): params is RelatedArtistArtworkModuleParams {
  return (
    isFollowedArtistArtworkModuleParams(params) &&
    params.hasOwnProperty("related_artist_id")
  )
}

export function isFollowedGeneArtworkModuleParams(
  params: HomePageArtworkModuleDetails["params"]
): params is FollowedGeneArtworkModuleParams {
  return !!params && params.hasOwnProperty("gene")
}

export function isGenericGeneArtworkModuleParams(
  params: HomePageArtworkModuleDetails["params"]
): params is GenericGeneArtworkModuleParams {
  return !!params && params.hasOwnProperty("gene_id")
}

export interface HomePageArtworkModuleResolvers {
  [field: string]: (
    context: ResolverContext,
    params: HomePageArtworkModuleDetails["params"]
  ) => unknown | null
}
