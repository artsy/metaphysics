import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "schema/v2/crmContact/mutationHelpers"

interface Input {
  id: string
  bodyHTML: string
}

const ReplyType = new GraphQLObjectType<any, ResolverContext>({
  name: "ReplyToEmailMessageReply",
  fields: () => ({
    providerMessageID: {
      type: GraphQLString,
      description: "The provider's ID of the sent message",
      resolve: ({ provider_message_id }) => provider_message_id,
    },
    providerThreadID: {
      type: GraphQLString,
      description: "The provider's ID of the thread the reply was added to",
      resolve: ({ provider_thread_id }) => provider_thread_id,
    },
    rfcMessageID: {
      type: GraphQLString,
      description: "The RFC 2822 Message-ID of the sent message",
      resolve: ({ rfc_message_id }) => rfc_message_id,
    },
  }),
})

const ResponseOrErrorType = responseOrErrorType({
  name: "ReplyToEmailMessage",
  payloadField: "reply",
  payloadType: ReplyType,
})

export const replyToEmailMessageMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "ReplyToEmailMessage",
  description:
    "Reply to a synced email message from the mailbox that owns it. Only the mailbox owner can reply. The sent copy is stored by a background sync.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email message being replied to",
    },
    bodyHTML: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The HTML body of the reply",
    },
  },
  outputFields: {
    replyOrError: {
      type: ResponseOrErrorType,
      description: "On success: the provider IDs of the sent reply",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, bodyHTML },
    { replyToEmailMessageLoader }
  ) => {
    if (!replyToEmailMessageLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      replyToEmailMessageLoader(id, { body_html: bodyHTML })
    )
  },
})
