import { GraphQLList, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { InquiryQuestionType } from "../inquiry_question"
import { LocationType } from "../location"
import { InternalIDFields } from "../object_identification"
import { InquirerCollectorProfileType } from "./partnerInquirerCollectorProfile"

export const InquiryRequestType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerInquiryRequest",
  fields: () => ({
    ...InternalIDFields,
    shippingLocation: {
      type: LocationType,
      resolve: ({ inquiry_shipping_location }) => inquiry_shipping_location,
    },
    questions: {
      type: new GraphQLList(InquiryQuestionType),
      resolve: ({ inquiry_questions }) => inquiry_questions,
    },
    collectorProfile: {
      type: InquirerCollectorProfileType,
      resolve: (
        { id: inquiryId, partnerId },
        _args,
        { partnerInquirerCollectorProfileLoader }
      ) => {
        if (!partnerInquirerCollectorProfileLoader) return

        return partnerInquirerCollectorProfileLoader({
          partnerId,
          inquiryId,
        })
      },
    },
  }),
})
