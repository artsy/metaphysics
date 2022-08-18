import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { CollectorProfileType } from "../CollectorProfile/collectorProfile"

const CollectorProfile: GraphQLFieldConfig<void, ResolverContext> = {
  type: CollectorProfileType,
  description: "A collector profile.",
  resolve: (_root, _option, { collectorProfileLoader }) => {
    return collectorProfileLoader?.()
  },
}

export default CollectorProfile
