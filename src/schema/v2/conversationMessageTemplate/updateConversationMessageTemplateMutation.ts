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

interface UpdateConversationMessageTemplateInput {
  id: string
  title?: string
  body?: string
  description?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateConversationMessageTemplateSuccess",
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
  name: "UpdateConversationMessageTemplateFailure",
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
  name: "UpdateConversationMessageTemplateResponseOrError",
  types: [SuccessType, ErrorType],
})

export default mutationWithClientMutationId<
  UpdateConversationMessageTemplateInput,
  any,
  ResolverContext
>({
  name: "UpdateConversationMessageTemplate",
  description: "Updates an existing conversation message template",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the template to update",
    },
    title: {
      type: GraphQLString,
      description: "The title of the template",
    },
    body: {
      type: GraphQLString,
      description: "The body of the template",
    },
    description: {
      type: GraphQLString,
      description: "Optional description of the template",
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
    { updateConversationMessageTemplateLoader }
  ) => {
    if (!updateConversationMessageTemplateLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      const payload: any = {}
      if (args.title) payload.title = args.title
      if (args.body) payload.body = args.body
      if (args.description !== undefined) payload.description = args.description

      const conversationMessageTemplate = await updateConversationMessageTemplateLoader(
        args.id,
        payload
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
