import { GeneFamilyType } from "./gene_family"
import { pageable } from "relay-cursor-paging"
import {
  connectionDefinitions,
  connectionFromPromisedArray,
} from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const { connectionType: GeneFamilyConnection } = connectionDefinitions({
  nodeType: GeneFamilyType,
})

const GeneFamilies: GraphQLFieldConfig<void, ResolverContext> = {
  type: GeneFamilyConnection,
  description: "A list of Gene Families",
  args: pageable(),
  resolve: (_root, options, { geneFamiliesLoader }) => {
    const gravityOptions = Object.assign(
      {},
      convertConnectionArgsToGravityArgs(options),
      {
        sort: "position",
      }
    )
    return connectionFromPromisedArray(
      geneFamiliesLoader(gravityOptions),
      // FIXME: Need to type properly
      // @ts-ignore
      gravityOptions
    )
  },
}

export default GeneFamilies
