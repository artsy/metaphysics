import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ConversationMessageTemplateType } from "./conversationMessageTemplate"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { PartnerType } from "../partner/partner"

interface DeleteConversationMessageTemplateInput {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteConversationMessageTemplateSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    conversationMessageTemplate: {
      type: ConversationMessageTemplateType,
      resolve: (template) => template,
    },
    partner: {
      type: new GraphQLNonNull(PartnerType),
      resolve: (template, _args, { partnerLoader }) => {
        return partnerLoader(template.partner_id)
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteConversationMessageTemplateFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteConversationMessageTemplateResponseOrError",
  types: [SuccessType, ErrorType],
})

export default mutationWithClientMutationId<
  DeleteConversationMessageTemplateInput,
  any,
  ResolverContext
>({
  name: "DeleteConversationMessageTemplate",
  description: "Deletes a conversation message template",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the template to delete",
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    args,
    { deleteConversationMessageTemplateLoader }
  ) => {
    if (!deleteConversationMessageTemplateLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      const conversationMessageTemplate = await deleteConversationMessageTemplateLoader(
        args.id
      )

      return conversationMessageTemplate
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
