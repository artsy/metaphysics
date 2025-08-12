import gql from "lib/gql"
import { GraphQLSchema } from "graphql"
import { toGlobalId } from "graphql-relay"
import { GraphQLSchemaWithTransforms } from "graphql-tools"
import config from "config"

export const gravityStitchingEnvironment = (
  localSchema: GraphQLSchema,
  gravitySchema: GraphQLSchemaWithTransforms
) => {
  const { USE_UNSTITCHED_USER_ADDRESS } = config

  // Define the user address extensions conditionally
  const userAddressExtensions = USE_UNSTITCHED_USER_ADDRESS
    ? null
    : gql`
        extend type Me {
          addressConnection(
            first: Int
            last: Int
            after: String
            before: String
          ): UserAddressConnection
        }

        extend type UserAddress {
          id: ID!
        }

        # Mutation Payloads
        extend type CreateUserAddressPayload {
          me: Me
        }

        extend type UpdateUserAddressPayload {
          me: Me
        }

        extend type DeleteUserAddressPayload {
          me: Me
        }

        extend type UpdateUserDefaultAddressPayload {
          me: Me
        }
      `

  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: userAddressExtensions,
    resolvers: USE_UNSTITCHED_USER_ADDRESS
      ? {}
      : {
          Me: {
            addressConnection: {
              fragment: gql`
              ... on Me {
                __typename
              }
              `,
              resolve: (_parent, args, context, info) => {
                return info.mergeInfo.delegateToSchema({
                  schema: gravitySchema,
                  operation: "query",
                  fieldName: "_unused_gravity_userAddressConnection",
                  args: { ...args, userId: context.userID },
                  context,
                  info,
                })
              },
            },
          },
          UserAddress: {
            id: {
              fragment: gql`
              ... on UserAddress {
              internalID
              }
              `,
              resolve: (parent, _args, _context, _info) => {
                const internalID = parent.internalID
                return toGlobalId("UserAddress", internalID)
              },
            },
          },

          // Mutations
          CreateUserAddressPayload: {
            me: {
              resolve: (_parent, args, context, info) => {
                return info.mergeInfo.delegateToSchema({
                  schema: localSchema,
                  operation: "query",
                  fieldName: "me",
                  args,
                  context,
                  info,
                })
              },
            },
          },
          UpdateUserAddressPayload: {
            me: {
              resolve: (_parent, args, context, info) => {
                return info.mergeInfo.delegateToSchema({
                  schema: localSchema,
                  operation: "query",
                  fieldName: "me",
                  args,
                  context,
                  info,
                })
              },
            },
          },
          DeleteUserAddressPayload: {
            me: {
              resolve: (_parent, args, context, info) => {
                console.log("DELETE: DeleteUserAddressPayload")
                return info.mergeInfo.delegateToSchema({
                  schema: localSchema,
                  operation: "query",
                  fieldName: "me",
                  args,
                  context,
                  info,
                })
              },
            },
          },
          UpdateUserDefaultAddressPayload: {
            me: {
              resolve: (_parent, args, context, info) => {
                return info.mergeInfo.delegateToSchema({
                  schema: localSchema,
                  operation: "query",
                  fieldName: "me",
                  args,
                  context,
                  info,
                })
              },
            },
          },
        },
  }
}
