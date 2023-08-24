import { mutationWithClientMutationId } from "graphql-relay"
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { VerifiedRepresentativeType } from "schema/v2/verifiedRepresentative/verifiedRepresentative"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"

interface Input {
  artistId: string
  partnerId: string
}

const inputFields = {
  artistId: { type: new GraphQLNonNull(GraphQLString) },
  partnerId: { type: new GraphQLNonNull(GraphQLString) },
}

interface GravityInput {
  artist_id: string
  partner_id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateVerifiedRepresentativeSuccess",
  isTypeOf: (data) => data.id,
  fields: {
    verifiedRepresentative: {
      type: VerifiedRepresentativeType,
      resolve: (verifiedRepresentative) => verifiedRepresentative,
    },
  },
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateVerifiedRepresentativeFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateVerifiedRepresentativeResponseOrError",
  types: [SuccessType, FailureType],
})

export const createVerifiedRepresentativeMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreateVerifiedRepresentative",
  description: "Creates Verified Representative.",
  inputFields,
  outputFields: {
    verifiedRepresentativeOrError: {
      type: ResponseOrErrorType,
      description: "On success: the created Verified Representative.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createVerifiedRepresentativeLoader }) => {
    if (!createVerifiedRepresentativeLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const createVerifiedRepresentativeLoaderPayload = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
        {} as GravityInput
      )

    try {
      return await createVerifiedRepresentativeLoader(
        createVerifiedRepresentativeLoaderPayload
      )
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
