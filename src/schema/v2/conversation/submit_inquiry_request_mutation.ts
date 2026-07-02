import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { InternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "schema/v2/artwork/index"
import { ShowType } from "schema/v2/show"
import { UserType } from "schema/v2/user"
import { LocationType } from "schema/v2/location"

const InquiryItemType = new GraphQLUnionType({
  name: "InquiryItemType",
  types: [ArtworkType, ShowType],
  resolveType: ({ __typename }) => {
    switch (__typename) {
      case "Artwork":
        return ArtworkType
      case "PartnerShow":
        return ShowType
      default:
        return null
    }
  },
})

const InquiryQuestionInput = new GraphQLInputObjectType({
  name: "InquiryQuestionInput",
  fields: () => ({
    questionID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    details: {
      type: GraphQLString,
    },
  }),
})

export const InquiryRequest = new GraphQLObjectType<any, ResolverContext>({
  name: "InquiryRequest",
  description: "A request to inquire on an artwork",
  fields: () => ({
    ...InternalIDFields,
    contactGallery: {
      type: GraphQLBoolean,
      resolve: ({ contact_gallery }) => contact_gallery,
    },
    inquireable: {
      type: InquiryItemType,
      resolve: (result) => {
        const { inquireable_type, inquireable } = result
        return {
          __typename: inquireable_type,
          ...inquireable,
        }
      },
    },
    inquirer: {
      type: UserType,
      resolve: ({ inquirer }, _, { userByIDLoader }) => {
        const { id } = inquirer
        return userByIDLoader(id)
      },
    },
    shippingLocation: {
      type: LocationType,
      resolve: ({ inquiry_shipping_location }) => inquiry_shipping_location,
    },
    questions: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ inquiry_questions }) => inquiry_questions,
    },
  }),
})

export const submitInquiryRequestMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SubmitInquiryRequestMutation",
  description: "Create an artwork inquiry request",
  inputFields: {
    contactGallery: {
      type: GraphQLBoolean,
      description:
        "Whether or not to contact the gallery (for instance, for specialist questions)",
    },
    inquireableID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The inquireable object id (Artwork ID or Show ID)",
    },
    inquireableType: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of inquireable object (Artwork or Show)",
    },
    message: {
      type: GraphQLString,
      description: "Optional inquiry message",
    },
    questions: {
      type: new GraphQLList(InquiryQuestionInput),
      description: "List of structured inquiry questions",
    },
  },
  outputFields: {
    inquiryRequest: {
      type: InquiryRequest,
      description: "Artwork Inquiry request",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (
    { contactGallery, inquireableID, inquireableType, message, questions },
    { submitArtworkInquiryRequestLoader }
  ) => {
    if (inquireableType === "Artwork") {
      if (!submitArtworkInquiryRequestLoader) return null
      const locationQuestion = questions?.find(
        (question) => question.questionID === "shipping_quote"
      )
      let inquiryShippingLocation
      if (locationQuestion && locationQuestion.details) {
        try {
          inquiryShippingLocation = JSON.parse(locationQuestion.details)
        } catch (e) {
          console.log(`Invalid location detail ${locationQuestion.details}`)
        }
      }
      return submitArtworkInquiryRequestLoader({
        artwork: inquireableID,
        contact_gallery: contactGallery,
        message,
        inquiry_questions: questions?.map((question) => question.questionID),
        inquiry_shipping_location: inquiryShippingLocation,
      })
    } else if (inquireableType === "Show") {
      throw new Error("This mutation doesn't support show inquiries yet.")
    }
  },
})
