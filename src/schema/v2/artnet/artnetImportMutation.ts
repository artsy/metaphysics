import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

interface CreateArtnetImportMutationInputProps {
  partnerID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetImportSuccess",
  isTypeOf: ({ queued }) => queued === true,
  fields: () => ({
    queued: {
      type: GraphQLBoolean,
      resolve: ({ queued }) => queued,
    },
    artnetImportID: {
      type: GraphQLString,
      resolve: ({ artnet_import_id }) => artnet_import_id,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtnetImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const createArtnetImportMutation = mutationWithClientMutationId<
  CreateArtnetImportMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreateArtnetImportMutation",
  description:
    "Kicks off a background job to pull a gallery's Artnet inventory and create corresponding Artsy artwork records.",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner whose Artnet inventory to import.",
    },
  },
  outputFields: {
    artnetImportOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the queued import details. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ partnerID }, { createArtnetImportLoader }) => {
    if (!createArtnetImportLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const result = await createArtnetImportLoader({ partner_id: partnerID })
      return result
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
