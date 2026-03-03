import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { date } from "./fields/date"

export const MailchimpCampaignStatusEnum = new GraphQLEnumType({
  name: "MailchimpCampaignStatus",
  values: {
    DRAFT: { value: "draft" },
    SCHEDULED: { value: "scheduled" },
    SENT: { value: "sent" },
  },
})

export const MailchimpCampaignType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MailchimpCampaign",
  fields: () => ({
    ...InternalIDFields,
    campaignId: {
      type: GraphQLString,
      description: "The Mailchimp campaign ID",
      resolve: ({ campaign_id }) => campaign_id,
    },
    subjectLine: {
      type: GraphQLString,
      description: "The email subject line",
      resolve: ({ subject_line }) => subject_line,
    },
    previewText: {
      type: GraphQLString,
      description: "The email preview text",
      resolve: ({ preview_text }) => preview_text,
    },
    status: {
      type: MailchimpCampaignStatusEnum,
    },
    listId: {
      type: GraphQLString,
      description: "The Mailchimp list/audience ID used for this campaign",
      resolve: ({ list_id }) => list_id,
    },
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    partnerShowId: {
      type: GraphQLString,
      description: "The partner show associated with this campaign, if any",
      resolve: ({ partner_show_id }) => partner_show_id,
    },
    webId: {
      type: GraphQLString,
      description: "The Mailchimp web ID for linking to the campaign",
      resolve: ({ web_id }) => web_id,
    },
    mailchimpUrl: {
      type: GraphQLString,
      description: "The URL to view the campaign in Mailchimp",
      resolve: ({ mailchimp_url }) => mailchimp_url,
    },
    artworkIds: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "IDs of artworks included in this campaign",
      resolve: ({ artwork_ids }) => artwork_ids,
    },
    createdInMailchimpAt: date(),
    sentAt: date(),
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const mailchimpCampaign: GraphQLFieldConfig<any, ResolverContext> = {
  type: MailchimpCampaignType,
  description: "A Mailchimp campaign by ID",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the campaign",
    },
  },
  resolve: async (_root, { id }, { mailchimpCampaignLoader }) => {
    if (!mailchimpCampaignLoader) return null
    return mailchimpCampaignLoader(id)
  },
}

export const mailchimpCampaigns: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(MailchimpCampaignType))
  ),
  description: "A list of Mailchimp campaigns for a partner",
  args: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to filter campaigns by",
    },
    status: {
      type: MailchimpCampaignStatusEnum,
      description: "Filter campaigns by status",
    },
    size: {
      type: GraphQLString,
      description: "Number of results to return",
    },
    offset: {
      type: GraphQLString,
      description: "Offset for pagination",
    },
  },
  resolve: async (
    _root,
    { partnerId, status, size, offset },
    { mailchimpCampaignsLoader }
  ) => {
    if (!mailchimpCampaignsLoader) return []
    const params: Record<string, string | undefined> = {
      partner_id: partnerId,
      status,
      size,
      offset,
    }
    const { body } = await mailchimpCampaignsLoader(params)
    return body
  },
}
