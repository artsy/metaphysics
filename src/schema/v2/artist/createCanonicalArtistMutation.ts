import { GraphQLString, GraphQLUnionType } from "graphql"
import { GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "./index"

interface CreateCanonicalArtistMutationInput {
  birthday: string
  deathday: string
  displayName: string
  firstName: string
  lastName: string
  middleName: string
  nationality: string
}

const CreateCanonicalArtistSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreateCanonicalArtistSuccess",
  isTypeOf: (data) => {
    return data.id
  },
  fields: () => ({
    artist: {
      type: ArtistType,
      resolve: (artist) => artist,
    },
  }),
})

const CreateCanonicalArtistFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreateCanonicalArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const SuccessOrErrorType = new GraphQLUnionType({
  name: "CreateCanonicalArtistSuccessOrErrorType",
  types: [CreateCanonicalArtistSuccessType, CreateCanonicalArtistFailureType],
})

export const createCanonicalArtistMutation = mutationWithClientMutationId({
  name: "CreateCanonicalArtistMutation",
  description: "Create a canonical artist",
  inputFields: {
    birthday: { type: GraphQLString },
    deathday: { type: GraphQLString },
    displayName: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    middleName: { type: GraphQLString },
    nationality: { type: GraphQLString },
    partnerID: {
      type: GraphQLString,
      description:
        "When present, will create the partner-artist record as well",
    },
  },
  outputFields: {
    artistOrError: {
      type: SuccessOrErrorType,
      description: "Success or Error, where on success Artist is returned",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    args,
    { createArtistLoader, createPartnerArtistLoader }
  ) => {
    if (!createArtistLoader) {
      throw new Error("You need to be logged in to perform this action")
    }

    const { firstName, middleName, lastName, partnerID, ...otherArgs } = args

    if (partnerID && !createPartnerArtistLoader) {
      throw new Error("You need to be logged in to perform this action")
    }

    const names = {
      first: firstName,
      middle: middleName,
      last: lastName,
    }

    const transformedOtherPayload = Object.keys(otherArgs).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: otherArgs[key] }),
      {} as Omit<
        CreateCanonicalArtistMutationInput,
        "firstName" | "middleName" | "lastName"
      >
    )

    const gravityPayload = {
      ...names,
      ...transformedOtherPayload,
    }

    try {
      const createdArtist = await createArtistLoader(gravityPayload)

      if (partnerID) {
        await createPartnerArtistLoader(
          {
            artistID: createdArtist.id,
            partnerID: partnerID,
          },
          { represented_by: false }
        )
      }

      return createdArtist
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
