import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { AgreementType } from "schema/v2/agreement"
import { date } from "schema/v2/fields/date"

export const PartnerAgreementType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "PartnerAgreement",
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLID),
        description: "Unique ID for this partner agreement",
        resolve: ({ id }) => id,
      },
      acceptedAt: date(),
      acceptedBy: {
        type: GraphQLString,
        description: "ID of user who accepted this agreement",
        resolve: ({ accepted_by }) => accepted_by,
      },
      agreement: {
        type: new GraphQLNonNull(AgreementType),
        description: "The associated agreement",
        resolve: ({ agreement }) => agreement,
      },
    }),
  }
)
