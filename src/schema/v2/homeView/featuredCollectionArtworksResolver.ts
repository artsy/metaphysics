import { filterArtworksConnectionWithParams } from "../filterArtworksConnection"

export const featuredCollectionArtworksResolver = (collectionId: string) => {
  return async (parent, args, context, info) => {
    const loader = filterArtworksConnectionWithParams((_args) => {
      return {
        marketing_collection_id: collectionId,
      }
    })

    if (!loader?.resolve) {
      return
    }

    const result = await loader.resolve(parent, args, context, info)

    return result
  }
}
