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
import { ArtworkTemplateType } from "../artworkTemplateType"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkTemplateSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkTemplate: {
      type: ArtworkTemplateType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkTemplateFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkTemplateResponseOrError",
  types: [SuccessType, FailureType],
})

interface CreateArtworkTemplateInput {
  partnerId: string
  artworkId: string
  title: string
}

interface CreateArtworkTemplatePayload {
  partnerId: string
  artwork_id: string
  title: string
}

export const CreateArtworkTemplateMutation = mutationWithClientMutationId<
  CreateArtworkTemplatePayload,
  CreateArtworkTemplateInput,
  ResolverContext
>({
  name: "CreateArtworkTemplate",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    artworkTemplateOrError: {
      type: ResponseOrErrorType,
      resolve: (result: any) => result,
    },
  },
  mutateAndGetPayload: async (
    args: CreateArtworkTemplateInput,
    { createArtworkTemplateLoader }
  ) => {
    if (!createArtworkTemplateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs = {
      artwork_id: args.artworkId,
      title: args.title,
    }

    try {
      const result = await createArtworkTemplateLoader(
        { partnerId: args.partnerId },
        gravityArgs
      )
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
