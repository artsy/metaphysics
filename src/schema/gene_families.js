import GeneFamily from "./gene_family"
import { pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromPromisedArray } from "graphql-relay"
import { parseRelayOptions } from "lib/helpers"

const { connectionType: GeneFamilyConnection } = connectionDefinitions({
  nodeType: GeneFamily.type,
})

const GeneFamilies = {
  type: GeneFamilyConnection,
  description: "A list of Gene Families",
  args: pageable(),
  resolve: (_root, options, _request, { rootValue }) => {
    const gravityOptions = Object.assign({}, parseRelayOptions(options), {
      sort: "position",
    })
    return connectionFromPromisedArray(rootValue.geneFamiliesLoader(gravityOptions), gravityOptions)
  },
}

export default GeneFamilies
