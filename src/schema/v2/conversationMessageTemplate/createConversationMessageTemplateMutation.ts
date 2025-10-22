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

interface CreateConversationMessageTemplateInput {
  partnerId: string
  title: string
  body: string
  description?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateConversationMessageTemplateSuccess",
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
  name: "CreateConversationMessageTemplateFailure",
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
  name: "CreateConversationMessageTemplateResponseOrError",
  types: [SuccessType, ErrorType],
})

export default mutationWithClientMutationId<
  CreateConversationMessageTemplateInput,
  any,
  ResolverContext
>({
  name: "CreateConversationMessageTemplate",
  description: "Creates a new conversation message template",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner",
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The title of the template",
    },
    body: {
      type: new GraphQLNonNull(GraphQLString),
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
    { createConversationMessageTemplateLoader }
  ) => {
    if (!createConversationMessageTemplateLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      const conversationMessageTemplate = await createConversationMessageTemplateLoader(
        {
          partner_id: args.partnerId,
          title: args.title,
          body: args.body,
          description: args.description,
        }
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
