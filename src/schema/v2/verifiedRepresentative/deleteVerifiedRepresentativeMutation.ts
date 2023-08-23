import { GraphQLString, GraphQLUnionType, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { VerifiedRepresentativeType } from "schema/v2/verifiedRepresentative/verifiedRepresentative"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  id: string
}

const inputFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteVerifiedRepresentativeSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    verifiedRepresentative: {
      type: VerifiedRepresentativeType,
      resolve: (verifiedRepresentative) => verifiedRepresentative,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteVerifiedRepresentativeFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteVerifiedRepresentativeResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteVerifiedRepresentativeMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "DeleteVerifiedRepresentativeMutation",
  description: "Deletes a Verified Representative.",
  inputFields,
  outputFields: {
    verifiedRepresentativeOrError: {
      type: ResponseOrErrorType,
      description: "On success: the deleted Verified Representative.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id },
    { deleteVerifiedRepresetativeLoader }
  ) => {
    if (!deleteVerifiedRepresetativeLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteVerifiedRepresetativeLoader(id)
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
