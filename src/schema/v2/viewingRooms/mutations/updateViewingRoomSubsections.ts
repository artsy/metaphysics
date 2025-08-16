import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ARImageInputType } from "./ARImageInput"
import { ViewingRoomSubsectionType } from "schema/v2/viewingRoomSubsection"
import { identity, pickBy } from "lodash"

const ViewingRoomSubsectionAttributes = new GraphQLInputObjectType({
  name: "ViewingRoomSubsectionAttributes",
  fields: {
    body: {
      type: GraphQLString,
    },
    caption: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
  },
})

const ViewingRoomSubsectionInput = new GraphQLInputObjectType({
  name: "ViewingRoomSubsectionInput",
  fields: {
    attributes: {
      type: ViewingRoomSubsectionAttributes,
    },
    delete: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    image: {
      type: ARImageInputType,
    },
    internalID: {
      type: GraphQLID,
    },
  },
})

export const updateViewingRoomSubsectionsMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateViewingRoomSubsections",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    subsections: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ViewingRoomSubsectionInput))
      ),
    },
  },
  outputFields: {
    subsections: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ViewingRoomSubsectionType))
      ),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateViewingRoomSubsectionsLoader }) => {
    if (!updateViewingRoomSubsectionsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const subsections = args.subsections.map((subsection) => {
      return pickBy(
        {
          id: subsection.internalID,
          delete: subsection.delete,
          ar_image_id: subsection.image?.internalID,
          attributes: pickBy(
            {
              body: subsection.attributes?.body,
              caption: subsection.attributes?.caption,
              title: subsection.attributes?.title,
            },
            identity
          ),
        },
        identity
      )
    })

    const response = await updateViewingRoomSubsectionsLoader(
      args.viewingRoomID,
      {
        subsections: subsections,
      }
    )

    return response
  },
})
