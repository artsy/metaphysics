import { CollectionType, collectionResolverFactory } from "schema/v1/collection"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

// Forward this directly to the collection resolver with known defaults.

const SavedArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: CollectionType,
  resolve: collectionResolverFactory("saved-artwork"),
}

export default SavedArtworks
