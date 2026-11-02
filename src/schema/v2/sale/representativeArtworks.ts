import { ResolverContext } from "types/graphql"

// Batch-hydrate each sale's representative artworks in one /artworks call and
// stash them on the node, so Sale.representativeArtworks avoids a per-node call
// when sales come through a connection (see AGENTS.md on N+1 in connections).
export const attachSaleRepresentativeArtworks = async (
  sales: any[],
  { artworksLoader }: ResolverContext
): Promise<void> => {
  const ids = [
    ...new Set(sales.flatMap((sale) => sale.representative_artwork_ids ?? [])),
  ]
  const artworks: any[] = ids.length
    ? await artworksLoader({ ids, batched: true })
    : []

  const byId = new Map(artworks.filter(Boolean).map((a) => [a._id, a]))

  sales.forEach((sale) => {
    sale._representativeArtworks = ((sale.representative_artwork_ids ??
      []) as string[])
      .map((id) => byId.get(id))
      .filter(Boolean)
  })
}
