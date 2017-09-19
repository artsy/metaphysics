import { GraphQLObjectType, GraphQLBoolean } from "graphql"

const UserStatusesType = new GraphQLObjectType({
  name: "UserStatuses",
  fields: {
    conversations: {
      type: GraphQLBoolean,
      resolve: (root, { id }, request, { rootValue: { conversationsLoader } }) => {
        if (!conversationsLoader) return null
        return conversationsLoader({ page: 1, size: 0 }).then(({ total_count }) => {
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
