import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLObjectType,
  Thunk,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { CollectorProfileFields } from "schema/v2/CollectorProfile/collectorProfile"

const InquirerCollectorProfileFields: Thunk<GraphQLFieldConfigMap<
  any,
  ResolverContext
>> = () => {
  const baseFields =
    typeof CollectorProfileFields === "function"
      ? CollectorProfileFields()
      : CollectorProfileFields

  return {
    ...baseFields,
    hasPartnerFollow: {
      type: GraphQLBoolean,
      description: "The Collector follows the Gallery profile",
      resolve: ({ follows_profile }) => follows_profile,
    },
  }
}

export const InquirerCollectorProfileType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "InquirerCollectorProfile",
  fields: InquirerCollectorProfileFields,
})

export const PartnerInquirerCollectorProfile: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: InquirerCollectorProfileType,
  description: "Inquiry requester's profile",
}
