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
  birthday?: string
  blurb?: string
  coverArtworkId?: string
  deathday?: string
  displayName?: string
  first?: string
  gender?: string
  groupIndicator?: ArtistGroupIndicator
  hometown?: string
  id: string
  last?: string
  location?: string
  middle?: string
  nationality?: string
  public?: boolean
  targetSupplyPriority?: ArtistTargetSupplyPriority
  targetSupplyType?: ArtistTargetSupplyType
}

const inputFields = {
  alternateNames: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  birthday: { type: GraphQLString },
  blurb: { type: GraphQLString },
  coverArtworkId: { type: GraphQLString },
  deathday: { type: GraphQLString },
  displayName: { type: GraphQLString },
  first: { type: GraphQLString },
  gender: { type: GraphQLString },
  groupIndicator: { type: ArtistGroupIndicatorEnum },
  hometown: { type: GraphQLString },
  id: { type: new GraphQLNonNull(GraphQLString) },
  last: { type: GraphQLString },
  location: { type: GraphQLString },
  middle: { type: GraphQLString },
  nationality: { type: GraphQLString },
  public: { type: GraphQLBoolean },
  targetSupplyPriority: { type: ArtistTargetSupplyPriorityEnum },
  targetSupplyType: { type: ArtistTargetSupplyTypeEnum },
}

interface GravityInput {
  alternate_names: string[]
  birthday?: string
  blurb?: string
  cover_artwork_id?: string
  deathday?: string
  display_name?: string
  first?: string
  gender?: string
  group_indicator?: string
  hometown?: string
  id: string
  last?: string
  location?: string
  middle?: string
  nationality?: string
  public?: boolean
  target_supply_priority?: string
  target_supply_type?: string
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
