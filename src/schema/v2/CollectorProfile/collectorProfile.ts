import date from "schema/v2/fields/date"
import { InternalIDFields } from "schema/v2/object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { userInterestType } from "../me/userInterests"

export const CollectorProfileFields: GraphQLFieldConfigMap<
  any,
  ResolverContext
> = {
  ...InternalIDFields,
  collectorLevel: {
    type: GraphQLInt,
    resolve: ({ collector_level }) => collector_level,
  },
  companyName: {
    type: GraphQLString,
    resolve: ({ company_name }) => company_name,
  },
  companyWebsite: {
    type: GraphQLString,
    resolve: ({ company_website }) => company_website,
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
  privacy: { type: GraphQLString },
  professionalBuyerAppliedAt: date,
  professionalBuyerAt: date,
  selfReportedPurchases: {
    type: GraphQLString,
    resolve: ({ self_reported_purchases }) => self_reported_purchases,
  },
  userInterests: {
    type: new GraphQLNonNull(new GraphQLList(userInterestType)),
    resolve: (_collectorProfile, _args, { meUserInterestsLoader }) => {
      return meUserInterestsLoader?.()
    },
  },
}

export const CollectorProfileType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "CollectorProfileType",
    fields: CollectorProfileFields,
  }
)

export const CollectorProfile: GraphQLFieldConfig<void, ResolverContext> = {
  type: CollectorProfileType,
  description: "A collector profile.",
  resolve: (_root, _option, { meCollectorProfileLoader }) => {
    return meCollectorProfileLoader?.()
  },
}
