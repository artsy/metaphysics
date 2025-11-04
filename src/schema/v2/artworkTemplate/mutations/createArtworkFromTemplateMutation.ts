import {
  GraphQLString,
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
  partnerId: string
  templateId: string
}

interface CreateArtworkFromTemplatePayload {
  partnerId: string
  templateId: string
}

export const CreateArtworkFromTemplateMutation = mutationWithClientMutationId<
  CreateArtworkFromTemplatePayload,
  CreateArtworkFromTemplateInput,
  ResolverContext
>({
  name: "CreateArtworkFromTemplate",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    templateId: {
      type: new GraphQLNonNull(GraphQLString),
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
        partnerId: args.partnerId,
        templateId: args.templateId,
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
