import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import Partner from "./partner"

interface UpdatePartnerFlagsMutationInputProps {
  id: string
}

export const updatePartnerFlagsMutation = mutationWithClientMutationId<
  UpdatePartnerFlagsMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerFlagsMutation",
  description: "Updates the flags on a partner.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
  },
  outputFields: {
    partner: {
      type: Partner.type,
      resolve: (partner) => partner,
    },
  },
  mutateAndGetPayload: async ({ id }, { updatePartnerFlagsLoader }) => {
    if (!updatePartnerFlagsLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const timestamp = new Date().getTime()

      const response = await updatePartnerFlagsLoader(id, {
        key: "last_cms_access",
        value: timestamp,
      })
      return response
    } catch (error) {
      throw new Error(error.body.error)
    }
  },
})
