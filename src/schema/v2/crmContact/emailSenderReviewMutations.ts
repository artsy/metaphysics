import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { EmailSenderReviewType } from "./emailSenderReview"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const ApproveResponseOrErrorType = responseOrErrorType({
  name: "ApproveEmailSenderReview",
  payloadField: "emailSenderReview",
  payloadType: EmailSenderReviewType,
})

export const approveEmailSenderReviewMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "ApproveEmailSenderReview",
  description:
    "Approve a pending email sender review. Finds or creates a CRM contact for the sender and releases the sender's withheld mail in the background.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the review",
    },
    crmContactID: {
      type: GraphQLString,
      description:
        "An existing CRM contact to link the sender to. A new contact is created when omitted.",
    },
  },
  outputFields: {
    emailSenderReviewOrError: {
      type: ApproveResponseOrErrorType,
      description: "On success: the approved review",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, crmContactID },
    { approveEmailSenderReviewLoader }
  ) => {
    if (!approveEmailSenderReviewLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      approveEmailSenderReviewLoader(id, {
        crm_contact_id: crmContactID,
      })
    )
  },
})

const SkipResponseOrErrorType = responseOrErrorType({
  name: "SkipEmailSenderReview",
  payloadField: "emailSenderReview",
  payloadType: EmailSenderReviewType,
})

export const skipEmailSenderReviewMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SkipEmailSenderReview",
  description:
    "Skip a pending email sender review. Further mail from the sender is dropped until the review is unskipped or approved.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the review",
    },
  },
  outputFields: {
    emailSenderReviewOrError: {
      type: SkipResponseOrErrorType,
      description: "On success: the skipped review",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { skipEmailSenderReviewLoader }) => {
    if (!skipEmailSenderReviewLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => skipEmailSenderReviewLoader(id))
  },
})

const UnskipResponseOrErrorType = responseOrErrorType({
  name: "UnskipEmailSenderReview",
  payloadField: "emailSenderReview",
  payloadType: EmailSenderReviewType,
})

export const unskipEmailSenderReviewMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UnskipEmailSenderReview",
  description: "Return a skipped email sender review to pending",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the review",
    },
  },
  outputFields: {
    emailSenderReviewOrError: {
      type: UnskipResponseOrErrorType,
      description: "On success: the pending review",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { unskipEmailSenderReviewLoader }) => {
    if (!unskipEmailSenderReviewLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => unskipEmailSenderReviewLoader(id))
  },
})
