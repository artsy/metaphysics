import { GraphQLNonNull, GraphQLObjectType, GraphQLString, GraphQLUnionType } from "graphql";
import { mutationWithClientMutationId } from "graphql-relay";
import { formatGravityError, GravityMutationErrorType } from "lib/gravityErrorHandler";
import { ResolverContext } from "types/graphql";


const AccountMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AccountMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    me: {
      type: me.type,
      resolve: (me) => me,
    }
  }),
})

const AccountMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AccountMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

export const AccountMutationType = new GraphQLUnionType({
  name: "AccountMutationType",
  types: [AccountMutationSuccessType, AccountMutationFailureType],
})

export const deleteUserAccountMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteAccount",
  description: "Delete User Artsy Account",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    userAccountOrError: {
      type: AccountMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: ({ id }, { deleteUserAccountLoader }) => {
    if (!deleteUserAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return (deleteUserAccountLoader(id)
      .then((result) => result)
      .catch((error) => {
        const formattedErr = formatGravityError(error)

        if(formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
    )
  },
})