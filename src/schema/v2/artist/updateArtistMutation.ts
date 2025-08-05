import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"
import { ArtistType } from "./index"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import {
  ArtistTargetSupplyPriorityEnum,
  ArtistTargetSupplyPriority,
  ArtistTargetSupplyType,
  ArtistTargetSupplyTypeEnum,
} from "./targetSupply/index"
import {
  ArtistGroupIndicator,
  ArtistGroupIndicatorEnum,
} from "schema/v2/artist/groupIndicator"

interface Input {
  alternateNames: string[]
  awards?: string
  biennials?: string
  birthday?: string
  blurb?: string
  criticallyAcclaimed?: boolean
  coverArtworkId?: string
  deathday?: string
  displayName?: string
  first?: string
  foundations?: string
  gender?: string
  groupIndicator?: ArtistGroupIndicator
  hometown?: string
  id: string
  last?: string
  location?: string
  middle?: string
  nationality?: string
  public?: boolean
  recentShow?: string
  residencies?: string
  reviewSources?: string
  targetSupplyPriority?: ArtistTargetSupplyPriority
  targetSupplyType?: ArtistTargetSupplyType
  vanguardYear?: string
}

const inputFields = {
  alternateNames: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  awards: { type: GraphQLString },
  birthday: { type: GraphQLString },
  biennials: { type: GraphQLString },
  blurb: { type: GraphQLString },
  criticallyAcclaimed: { type: GraphQLBoolean },
  coverArtworkId: { type: GraphQLString },
  deathday: { type: GraphQLString },
  displayName: { type: GraphQLString },
  first: { type: GraphQLString },
  foundations: { type: GraphQLString },
  gender: { type: GraphQLString },
  groupIndicator: { type: ArtistGroupIndicatorEnum },
  hometown: { type: GraphQLString },
  id: { type: new GraphQLNonNull(GraphQLString) },
  last: { type: GraphQLString },
  location: { type: GraphQLString },
  middle: { type: GraphQLString },
  nationality: { type: GraphQLString },
  public: { type: GraphQLBoolean },
  recentShow: { type: GraphQLString },
  residencies: { type: GraphQLString },
  reviewSources: { type: GraphQLString },
  targetSupplyPriority: { type: ArtistTargetSupplyPriorityEnum },
  targetSupplyType: { type: ArtistTargetSupplyTypeEnum },
  vanguardYear: { type: GraphQLString },
}

interface GravityInput {
  alternate_names: string[]
  awards?: string
  birthday?: string
  biennials?: string
  blurb?: string
  cover_artwork_id?: string
  critically_acclaimed?: boolean
  deathday?: string
  display_name?: string
  first?: string
  foundations?: string
  gender?: string
  group_indicator?: string
  hometown?: string
  id: string
  last?: string
  location?: string
  middle?: string
  nationality?: string
  public?: boolean
  residencies?: string
  recent_show?: string
  review_sources?: string
  target_supply_priority?: string
  target_supply_type?: string
  vanguard_year?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtistSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artist: {
      type: ArtistType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtistResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateArtistMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateArtistMutation",
  description: "Update the artist",
  inputFields,
  outputFields: {
    artistOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated artist",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateArtistLoader }) => {
    if (!updateArtistLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const updateArtistLoaderPayload = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
        {} as GravityInput
      )

    try {
      return await updateArtistLoader(args.id, updateArtistLoaderPayload)
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
