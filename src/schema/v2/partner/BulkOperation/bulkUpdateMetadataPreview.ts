import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

const BulkUpdateMetadataPreviewCountsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdateMetadataPreviewCounts",
  fields: {
    total: { type: new GraphQLNonNull(GraphQLInt) },
    editable: { type: new GraphQLNonNull(GraphQLInt) },
    nonEditable: {
      type: new GraphQLNonNull(GraphQLInt),
      description:
        "Number of artworks that cannot be edited (total - editable).",
      resolve: ({ total, editable }) => total - editable,
    },
  },
})

const BulkUpdateMetadataPreviewType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "BulkUpdateMetadataPreview",
  fields: {
    counts: { type: new GraphQLNonNull(BulkUpdateMetadataPreviewCountsType) },
  },
})

export const bulkUpdateMetadataPreview: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: BulkUpdateMetadataPreviewType,
  description: "Preview counts of artworks affected by a bulk metadata update.",
  args: {
    artworkIds: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "IDs of artworks to include in the preview.",
    },
    partnerListId: {
      type: GraphQLString,
      description: "ID of a partner list to filter artworks.",
    },
    updateCatalog: {
      type: GraphQLBoolean,
      description: "When true, excludes live artworks from the editable count.",
    },
  },
  resolve: async (
    { id },
    { artworkIds, partnerListId, updateCatalog },
    { bulkUpdateMetadataPreviewLoader }
  ) => {
    if (!bulkUpdateMetadataPreviewLoader) return null

    const params: Record<string, unknown> = {}

    if (artworkIds) params.artwork_ids = artworkIds
    if (partnerListId) params.partner_list_id = partnerListId
    if (updateCatalog != null) params.update_catalog = updateCatalog

    return bulkUpdateMetadataPreviewLoader(id, params)
  },
}
