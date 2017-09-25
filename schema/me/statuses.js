import { GraphQLObjectType, GraphQLBoolean } from "graphql"
import { isExisty, queryContainsField, parseArguments, parseRelayOptions } from "../../lib/helpers"
import { includes } from "lodash"

const UserStatusesType = new GraphQLObjectType({
  name: "UserStatuses",
  fields: {
    // If querying for conversations, just pluck `total_count` from there, by re-using params.
    conversations: {
      type: GraphQLBoolean,
      resolve: ({ rootFieldNodes }, options, request, { rootValue: { conversationsLoader }, fieldNodes }) => {
        if (!conversationsLoader) return null
        const args = parseArguments(rootFieldNodes)[1]
        let pageOptions = { page: 1, size: 0 }
        if (args && args.length > 0) {
          delete pageOptions["page"]
          delete pageOptions["size"]
          pageOptions[args[0].name.value] = parseInt(args[0].value.value)
        }
        let { page, size } = parseRelayOptions(pageOptions)
        if (!isExisty(page)) {
          page = 1
        }
        if (!isExisty(page)) {
          size = 0
        }
        return conversationsLoader({ page, size }).then(({ total_count }) => {
          return total_count > 0
        })
      },
    },
  },
})

const UserStatuses = {
  type: UserStatusesType,
  resolve: me => me,
}

export default UserStatuses
