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

interface Input {
  description: string
  internalName: string
  itemId: string
  itemIds: string[]
  itemType: ItemType
  key: string
  layout: string
  name: string
  ownerType: OwnerType
  published: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "createOrderedSetSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    set: {
      type: OrderedSetType,
      resolve: (orderedSet) => orderedSet,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "createOrderedSetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "createOrderedSetResponseOrError",
  types: [SuccessType, FailureType],
})

export const createOrderedSetMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "CreateOrderedSetMutation",
  description: "Creates an ordered set.",
  inputFields: {
    description: { type: GraphQLString },
    internalName: { type: GraphQLString },
    itemId: { type: GraphQLString },
    itemIds: { type: GraphQLList(GraphQLString) },
    itemType: { type: new GraphQLNonNull(GraphQLString) },
    key: { type: new GraphQLNonNull(GraphQLString) },
    layout: { type: OrderedSetLayoutsEnum },
    name: { type: GraphQLString },
    ownerType: { type: GraphQLString },
    published: { type: GraphQLBoolean },
  },
  outputFields: {
    orderedSetOrError: {
      type: ResponseOrErrorType,
      description: "On success: the ordered set created.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      description,
      internalName,
      itemId,
      itemIds,
      itemType,
      key,
      layout,
      name,
      ownerType,
      published,
    },
    { createSetLoader }
  ) => {
    if (!createSetLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await createSetLoader({
        description,
        internal_name: internalName,
        item_id: itemId,
        item_ids: itemIds,
        item_type: itemType,
        key,
        layout,
        name,
        owner_type: ownerType,
        published,
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
