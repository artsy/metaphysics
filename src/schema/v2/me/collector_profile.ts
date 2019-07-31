import date from "schema/v2/fields/date"
import { InternalIDFields } from "schema/v2/object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const CollectorProfileFields: GraphQLFieldConfigMap<
  any,
  ResolverContext
> = {
  ...InternalIDFields,
  email: {
    type: GraphQLString,
  },
  name: {
    type: GraphQLString,
  },
  confirmedBuyerAt: date,
  collectorLevel: {
    type: GraphQLInt,
    resolve: ({ collector_level }) => collector_level,
  },
  selfReportedPurchases: {
    type: GraphQLString,
    resolve: ({ self_reported_purchases }) => self_reported_purchases,
  },
  loyaltyApplicantAt: date,
  professionalBuyerAt: date,
  professionalBuyerAppliedAt: date,
  intents: {
    type: new GraphQLList(GraphQLString),
  },
}

export const CollectorProfileType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "CollectorProfileType",
    fields: CollectorProfileFields,
  }
)

const CollectorProfile: GraphQLFieldConfig<void, ResolverContext> = {
  type: CollectorProfileType,
  description: "A collector profile.",
  resolve: (_root, _option, { collectorProfileLoader }) =>
    !collectorProfileLoader ? null : collectorProfileLoader(),
}

export default CollectorProfile
