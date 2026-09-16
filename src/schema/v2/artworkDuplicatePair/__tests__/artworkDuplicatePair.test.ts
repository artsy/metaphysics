import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockPair = {
  id: "pair-1",
  artwork_1_id: "artwork-1",
  artwork_2_id: "artwork-2",
  status: "open",
  similarity_score: 0.95,
  detection_version: "v1",
  match_metadata: { field: "title" },
  mergeable: true,
  existing_artwork_also_imported: false,
  dismissed_at: null,
  merged_at: null,
  merged_into_artwork_id: null,
  merge_details: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockArtwork = {
  id: "artwork-slug",
  _id: "artwork-1",
  title: "Test Artwork",
}

describe("artworkDuplicatePair", () => {
  it("fetches a single pair by id", async () => {
    const artworkDuplicatePairLoader = jest.fn().mockResolvedValue(mockPair)
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const query = gql`
      query {
        artworkDuplicatePair(id: "pair-1") {
          internalID
          status
          similarityScore
          detectionVersion
          mergeable
          createdAt
          updatedAt
        }
      }
    `

    const result = await runAuthenticatedQuery(query, {
      artworkDuplicatePairLoader,
      artworkLoader,
    })

    expect(artworkDuplicatePairLoader).toHaveBeenCalledWith("pair-1")
    expect(result).toEqual({
      artworkDuplicatePair: {
        internalID: "pair-1",
        status: "OPEN",
        similarityScore: 0.95,
        detectionVersion: "v1",
        mergeable: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    })
  })

  it("resolves artwork1 and artwork2", async () => {
    const artworkDuplicatePairLoader = jest.fn().mockResolvedValue(mockPair)
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const query = gql`
      query {
        artworkDuplicatePair(id: "pair-1") {
          artwork1 {
            internalID
          }
          artwork2 {
            internalID
          }
        }
      }
    `

    await runAuthenticatedQuery(query, {
      artworkDuplicatePairLoader,
      artworkLoader,
    })

    expect(artworkLoader).toHaveBeenCalledWith("artwork-1")
    expect(artworkLoader).toHaveBeenCalledWith("artwork-2")
  })

  it("resolves artnetImportID, importedArtwork, and existingArtwork for an import-scoped pair", async () => {
    const importScopedPair = {
      ...mockPair,
      artnet_import_id: "import-1",
      imported_artwork_id: "artwork-1",
    }
    const artworkDuplicatePairLoader = jest
      .fn()
      .mockResolvedValue(importScopedPair)
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const query = gql`
      query {
        artworkDuplicatePair(id: "pair-1") {
          artnetImportID
          importedArtwork {
            internalID
          }
          existingArtwork {
            internalID
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(query, {
      artworkDuplicatePairLoader,
      artworkLoader,
    })

    expect(result.artworkDuplicatePair.artnetImportID).toEqual("import-1")
    expect(artworkLoader).toHaveBeenCalledWith("artwork-1")
    expect(artworkLoader).toHaveBeenCalledWith("artwork-2")
  })

  it("resolves existingArtworkAlsoImported", async () => {
    const bothImportedPair = {
      ...mockPair,
      artnet_import_id: "import-1",
      imported_artwork_id: "artwork-1",
      existing_artwork_also_imported: true,
    }
    const artworkDuplicatePairLoader = jest
      .fn()
      .mockResolvedValue(bothImportedPair)
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const query = gql`
      query {
        artworkDuplicatePair(id: "pair-1") {
          existingArtworkAlsoImported
        }
      }
    `

    const result = await runAuthenticatedQuery(query, {
      artworkDuplicatePairLoader,
      artworkLoader,
    })

    expect(result.artworkDuplicatePair.existingArtworkAlsoImported).toBe(true)
  })

  it("returns null for artnetImportID, importedArtwork, and existingArtwork on an untagged pair", async () => {
    const artworkDuplicatePairLoader = jest.fn().mockResolvedValue(mockPair)
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const query = gql`
      query {
        artworkDuplicatePair(id: "pair-1") {
          artnetImportID
          importedArtwork {
            internalID
          }
          existingArtwork {
            internalID
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(query, {
      artworkDuplicatePairLoader,
      artworkLoader,
    })

    expect(result.artworkDuplicatePair).toEqual({
      artnetImportID: null,
      importedArtwork: null,
      existingArtwork: null,
    })
  })
})

describe("artworkDuplicatePairsConnection", () => {
  it("fetches a paginated list of pairs", async () => {
    const artworkDuplicatePairsLoader = jest.fn().mockResolvedValue({
      body: [mockPair],
      headers: { "x-total-count": "1" },
    })
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const query = gql`
      query {
        artworkDuplicatePairsConnection(partnerId: "partner-1", first: 10) {
          totalCount
          edges {
            node {
              internalID
              status
              similarityScore
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(query, {
      artworkDuplicatePairsLoader,
      artworkLoader,
    })

    expect(artworkDuplicatePairsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_id: "partner-1",
        size: 10,
        total_count: true,
      })
    )

    expect(result.artworkDuplicatePairsConnection.totalCount).toBe(1)
    expect(result.artworkDuplicatePairsConnection.edges).toHaveLength(1)
    expect(result.artworkDuplicatePairsConnection.edges[0].node).toEqual({
      internalID: "pair-1",
      status: "OPEN",
      similarityScore: 0.95,
    })
  })

  it("passes optional filters", async () => {
    const artworkDuplicatePairsLoader = jest.fn().mockResolvedValue({
      body: [],
      headers: { "x-total-count": "0" },
    })

    const query = gql`
      query {
        artworkDuplicatePairsConnection(
          partnerId: "partner-1"
          status: DISMISSED
          detectionVersion: "v2"
          first: 5
        ) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(query, { artworkDuplicatePairsLoader })

    expect(artworkDuplicatePairsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_id: "partner-1",
        status: "dismissed",
        detection_version: "v2",
        size: 5,
      })
    )
  })

  it("passes mergeable filter", async () => {
    const artworkDuplicatePairsLoader = jest.fn().mockResolvedValue({
      body: [],
      headers: { "x-total-count": "0" },
    })

    const query = gql`
      query {
        artworkDuplicatePairsConnection(
          partnerId: "partner-1"
          mergeable: true
          first: 10
        ) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(query, { artworkDuplicatePairsLoader })

    expect(artworkDuplicatePairsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_id: "partner-1",
        mergeable: true,
      })
    )
  })

  it("passes artnetImportID filter", async () => {
    const artworkDuplicatePairsLoader = jest.fn().mockResolvedValue({
      body: [],
      headers: { "x-total-count": "0" },
    })

    const query = gql`
      query {
        artworkDuplicatePairsConnection(
          partnerId: "partner-1"
          artnetImportID: "import-1"
          first: 10
        ) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(query, { artworkDuplicatePairsLoader })

    expect(artworkDuplicatePairsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_id: "partner-1",
        artnet_import_id: "import-1",
      })
    )
  })
})
