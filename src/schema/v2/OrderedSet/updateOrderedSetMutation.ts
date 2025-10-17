import {
  GraphQLString,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { OrderedSetType } from "./index"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { FeatureType } from "../Feature"
import { OrderedSetLayoutsEnum } from "./OrderedSetLayoutsEnum"

type ItemType =
  | "Artist"
  | "Artwork"
  | "Feature Link"
  | "Gene"
  | "Ordered Set"
  | "Partner Show"
  | "Profile"
  | "Sale"
  | "User"

type OwnerType = "Fair" | "Feature" | "Sale"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateOrderedSetSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    set: {
      type: OrderedSetType,
      resolve: (orderedSet) => orderedSet,
    },
    feature: {
      type: FeatureType,
      resolve: ({ owner, owner_type }) => {
        if (owner_type !== "Feature") return null
        return owner
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateOrderedSetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateOrderedSetResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateOrderedSetMutation = mutationWithClientMutationId({
  name: "UpdateOrderedSetMutation",
  description: "updates an ordered set.",
  inputFields: {
    description: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLString) },
    internalName: { type: GraphQLString },
    itemId: { type: GraphQLString },
    itemIds: {
      description:
        "Modify the OrderedSet's items to only included provided ids. An empty array will remove all items from the set",
      type: new GraphQLList(GraphQLString),
    },
    itemType: { type: GraphQLString },
    key: { type: GraphQLString },
    layout: { type: OrderedSetLayoutsEnum },
    name: { type: GraphQLString },
    ownerId: { type: GraphQLString },
    ownerType: { type: GraphQLString },
    published: { type: GraphQLBoolean },
    unsetOwner: { type: GraphQLBoolean },
  },
  outputFields: {
    orderedSetOrError: {
      type: ResponseOrErrorType,
      description: "On success: the ordered set updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      description,
      id,
      internalName,
      itemId,
      itemIds,
      itemType,
      key,
      layout,
      name,
      ownerType,
      published,
      ownerId,
      unsetOwner,
    },
    { updateSetLoader }
  ) => {
    if (!updateSetLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await updateSetLoader(id, {
        description,
        internal_name: internalName,
        item_id: itemId,
        item_ids: itemIds,
        item_type: itemType,
        key,
        layout,
        name,
        owner_id: ownerId,
        owner_type: ownerType,
        published,
        unset_owner: unsetOwner,
      })
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
