import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql"
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
    formattedFirstMessage: {
      type: GraphQLString,
      description:
        "Returns the first message of an inquiry with the addition of any inquiry questions submitted by the user, formatted and if present.",
      resolve: ({ inquiry_shipping_location, inquiry_questions, message }) => {
        if (!inquiry_questions || !inquiry_questions.length) return message
        const shippingQuote = () => {
          if (!inquiry_shipping_location) return "• Shipping Quote"
          const { city, country, state } = inquiry_shipping_location
          const stateOrCountry = country === "United States" ? state : country
          return `• Shipping Quote to ${[city, stateOrCountry].join(", ")}`
        }
        const lines = [
          "I would like to request the following information about this artwork:",
        ]

        inquiry_questions.forEach((question) => {
          lines.push(
            question.id === "shipping_quote"
              ? shippingQuote()
              : `• ${question?.question}`
          )
        })
        if (message) lines.unshift(`${message}\n`)
        return lines.join("\n")
      },
    },
    collectorProfile: {
      type: InquirerCollectorProfileType,
      resolve: async (
        { partnerId, inquirer },
        _args,
        { partnerCollectorProfileLoader }
      ) => {
        if (!partnerCollectorProfileLoader) return

        const data = await partnerCollectorProfileLoader({
          partnerId,
          userId: inquirer.id,
        })

        return {
          ...data.collector_profile,
          follows_profile: data.follows_profile,
        }
      },
    },
  }),
})
