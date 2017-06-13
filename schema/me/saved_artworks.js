import { CollectionType, collectionResolver } from "schema/collection"

// Forward this directly to the collection resolver with known defaults.

export default {
  type: CollectionType,
  resolve: (root, options, request, { fieldNodes, rootValue }) => {
    const { accessToken, userID } = (rootValue: any)
    return collectionResolver(fieldNodes, accessToken, userID, "saved-artwork")
  },
}
