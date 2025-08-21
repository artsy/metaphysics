/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import type { ResolverContext } from "types/graphql"

describe("Match", () => {
  const searchResults = [
    {
      id: "david-bowie",
      label: "Artist",
    },
    {
      id: "david-bowie-self-portrait",
      label: "Artwork",
    },
    {
      id: "minimalism",
      label: "Gene",
    },
    // un-supported type - shouldn't break the test
    {
      id: "artist-series",
      label: "ArtistSeries",
    },
  ]

  const searchResponse = {
    body: searchResults,
    headers: { "x-total-count": "4" },
  }

  const context: Partial<ResolverContext> = {
    artistLoader: jest.fn().mockResolvedValue({
      _id: "david-bowie",
      name: "David Bowie",
    }),
    artworkLoader: jest.fn().mockResolvedValue({
      _id: "david-bowie-self-portrait",
      title: "Self Portrait",
    }),
    geneLoader: jest.fn().mockResolvedValue({
      _id: "minimalism",
      name: "Minimalism",
    }),
    searchLoader: jest.fn().mockResolvedValue(searchResponse),
  }

  it("returns search results for a query", async () => {
    const query = gql`
      {
        matchConnection(term: "David Bowie", entities: [], mode: AUTOSUGGEST) {
          edges {
            node {
              ... on Artist {
                internalID
                name
              }

              ... on Artwork {
                internalID
                title
              }

              ... on Gene {
                internalID
                name
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    // Check that searchLoader was called with correct arguments
    expect(context.searchLoader).toHaveBeenCalledWith({
      term: "David Bowie",
      entities: [],
      mode: "AUTOSUGGEST",
      size: 10,
      offset: 0,
      total_count: true,
    })

    // Verify loaders were called with correct IDs
    expect(context.artistLoader).toHaveBeenCalledWith("david-bowie")
    expect(context.artworkLoader).toHaveBeenCalledWith(
      "david-bowie-self-portrait"
    )
    expect(context.geneLoader).toHaveBeenCalledWith("minimalism")

    const edges = data.matchConnection.edges

    // Check Artist result
    const artistNode = edges[0].node
    expect(artistNode.internalID).toBe("david-bowie")
    expect(artistNode.name).toBe("David Bowie")

    // Check Artwork result
    const artworkNode = edges[1].node
    expect(artworkNode.internalID).toBe("david-bowie-self-portrait")
    expect(artworkNode.title).toBe("Self Portrait")

    // Check Gene result
    const geneNode = edges[2].node
    expect(geneNode.internalID).toBe("minimalism")
    expect(geneNode.name).toBe("Minimalism")
  })
})
