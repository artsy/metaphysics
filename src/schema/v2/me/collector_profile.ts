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
  collectorLevel: {
    type: GraphQLInt,
    resolve: ({ collector_level }) => collector_level,
  },
  confirmedBuyerAt: date,
  email: { type: GraphQLString },
  institutionalAffiliations: {
    type: GraphQLString,
    resolve: ({ institutional_affiliations }) => institutional_affiliations,
  },
  intents: { type: new GraphQLList(GraphQLString) },
  loyaltyApplicantAt: date,
  name: { type: GraphQLString },
  professionalBuyerAppliedAt: date,
  professionalBuyerAt: date,
  selfReportedPurchases: {
    type: GraphQLString,
    resolve: ({ self_reported_purchases }) => self_reported_purchases,
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
  resolve: (_root, _option, { collectorProfileLoader }) => {
    return collectorProfileLoader?.()
  },
}

export default CollectorProfile
