import { GraphQLInt, GraphQLList, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { collectorProfileBaseFields } from "schema/v2/CollectorProfile/collectorProfile"
import { NodeInterface } from "../object_identification"
import { PartnerOfferSourceEnumType } from "../partnerOffer"

const OfferableActivityCollectorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OfferableActivityCollector",
  description:
    "A collector with eligible offerable activity on the artwork, and how they engaged with it.",
  interfaces: [NodeInterface],
  fields: {
    ...collectorProfileBaseFields,
    sources: {
      type: new GraphQLList(PartnerOfferSourceEnumType),
      description:
        "The way this collector engaged with the artwork (e.g. saved it and/or abandoned an order).",
      resolve: ({ sources }) => sources,
    },
  },
})

export const OfferableActivityType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OfferableActivity",
  fields: {
    totalCount: {
      type: GraphQLInt,
      description: "Count of collectors with eligible offerable activities.",
    },
    collectors: {
      type: new GraphQLList(OfferableActivityCollectorType),
      description:
        "Details of the collectors with eligible offerable activities.",
      resolve: ({ collectors }) => collectors,
    },
  },
})
