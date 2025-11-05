import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkType } from "schema/v2/artwork"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkFromTemplateSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artwork: {
      type: ArtworkType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkFromTemplateFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkFromTemplateResponseOrError",
  types: [SuccessType, FailureType],
})

interface CreateArtworkFromTemplateInput {
  partnerID: string
  artworkTemplateID: string
}

export const CreateArtworkFromTemplateMutation = mutationWithClientMutationId<
  CreateArtworkFromTemplateInput,
  any,
  ResolverContext
>({
  name: "CreateArtworkFromTemplate",
  description: "Create an artwork from an artwork template.",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the partner.",
    },
    artworkTemplateID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the artwork template.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      resolve: (result: any) => result,
    },
  },
  mutateAndGetPayload: async (
    args: CreateArtworkFromTemplateInput,
    { createArtworkFromTemplateLoader }
  ) => {
    if (!createArtworkFromTemplateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await createArtworkFromTemplateLoader({
        partnerId: args.partnerID,
        templateId: args.artworkTemplateID,
      })
      return result
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
