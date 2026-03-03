import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { MailchimpCampaignType } from "./mailchimpCampaign"

interface Input {
  mailchimpAccountId: string
  artworkIds?: string[]
  partnerShowId?: string
  subjectLine: string
  previewText?: string
  listId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateMailchimpCampaignSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    mailchimpCampaign: {
      type: MailchimpCampaignType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateMailchimpCampaignFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateMailchimpCampaignResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "CreateMailchimpCampaignFailure"
    }
    return "CreateMailchimpCampaignSuccess"
  },
})

export const createMailchimpCampaignMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreateMailchimpCampaign",
  description: "Create a Mailchimp campaign draft for a partner",
  inputFields: {
    mailchimpAccountId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the Mailchimp account to use",
    },
    artworkIds: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Artwork IDs to include in the campaign (mutually exclusive with partnerShowId)",
    },
    partnerShowId: {
      type: GraphQLString,
      description:
        "Partner show ID to create campaign from (mutually exclusive with artworkIds)",
    },
    subjectLine: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The email subject line",
    },
    previewText: {
      type: GraphQLString,
      description: "The email preview text",
    },
    listId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The Mailchimp list/audience ID to send the campaign to",
    },
  },
  outputFields: {
    mailchimpCampaignOrError: {
      type: ResponseOrErrorType,
      description: "On success: the created Mailchimp campaign",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      mailchimpAccountId,
      artworkIds,
      partnerShowId,
      subjectLine,
      previewText,
      listId,
    },
    { createMailchimpCampaignLoader }
  ) => {
    if (!createMailchimpCampaignLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    if (artworkIds && partnerShowId) {
      throw new Error(
        'The "artworkIds" and "partnerShowId" arguments are mutually exclusive.'
      )
    }

    try {
      return await createMailchimpCampaignLoader({
        mailchimp_account_id: mailchimpAccountId,
        artwork_ids: artworkIds,
        partner_show_id: partnerShowId,
        subject_line: subjectLine,
        preview_text: previewText,
        list_id: listId,
      })
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
