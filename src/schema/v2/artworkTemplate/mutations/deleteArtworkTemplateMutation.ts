import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ArtworkTemplateType } from "schema/v2/artworkTemplate/artworkTemplateType"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface DeleteArtworkTemplateInputProps {
  partnerID: string
  artworkTemplateID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkTemplateSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artworkTemplate: {
      type: ArtworkTemplateType,
      resolve: (artworkTemplate) => artworkTemplate,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkTemplateFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteArtworkTemplateResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteArtworkTemplateMutation = mutationWithClientMutationId<
  DeleteArtworkTemplateInputProps,
  any,
  ResolverContext
>({
  name: "DeleteArtworkTemplate",
  description: "Delete an artwork template.",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the partner.",
    },
    artworkTemplateID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the artwork template to delete.",
    },
  },
  outputFields: {
    artworkTemplateOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the deleted artwork template. On failure: MutationError.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkTemplateID, partnerID },
    { deletePartnerArtworkTemplateLoader }
  ) => {
    if (!deletePartnerArtworkTemplateLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const artworkTemplate = await deletePartnerArtworkTemplateLoader({
        partnerId: partnerID,
        templateId: artworkTemplateID,
      })

      return artworkTemplate
    } catch (err) {
      const formattedErr = formatGravityError(err)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(err)
      }
    }
  },
})
