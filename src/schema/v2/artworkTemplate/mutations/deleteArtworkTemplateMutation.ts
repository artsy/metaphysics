import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ArtworkTemplateType } from "schema/v2/artworkTemplate/artworkTemplateType"

interface DeleteArtworkTemplateInputProps {
  partnerID: string
  artworkTemplateID: string
}

export const deleteArtworkTemplateMutation = mutationWithClientMutationId<
  DeleteArtworkTemplateInputProps,
  any,
  ResolverContext
>({
  name: "DeleteArtworkTemplate",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    artworkTemplateID: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    artworkTemplate: {
      type: new GraphQLNonNull(ArtworkTemplateType),
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

    const response = await deletePartnerArtworkTemplateLoader({
      partnerId: partnerID,
      templateId: artworkTemplateID,
    })

    return response
  },
})
