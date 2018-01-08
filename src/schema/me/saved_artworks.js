import { CollectionType, collectionResolverFactory } from "schema/collection"

// Forward this directly to the collection resolver with known defaults.

export default {
  type: CollectionType,
  resolve: collectionResolverFactory("saved-artwork"),
}
