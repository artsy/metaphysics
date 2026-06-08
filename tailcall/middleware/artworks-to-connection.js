function onArtworksConnectionResponse(response) {
  const artworks = JSON.parse(response)

  const edges = artworks.map((artwork, i) => ({
    cursor: 'artwork:' + i,
    node: artwork,
  }))

  return JSON.stringify({
    edges,
    totalCount: edges.length,
  })
}
