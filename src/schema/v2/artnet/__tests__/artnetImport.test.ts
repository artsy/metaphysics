import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("ArtnetImport type", () => {
  const query = `
    {
      artnetImport(id: "artnet-import-1") {
        internalID
        state
        totalCount
        createdCount
        skippedCount
        deletedCount
        errorCount
        unmatchedArtistNames
      }
    }
  `

  it("resolves scalar fields and maps state to the enum", async () => {
    const context = {
      artnetImportLoader: () =>
        Promise.resolve({
          id: "artnet-import-1",
          state: "completed",
          total_count: 10,
          created_count: 8,
          skipped_count: 1,
          deleted_count: 0,
          error_count: 1,
        }),
      artnetImportUnmatchedArtistNamesLoader: () =>
        Promise.resolve({ unmatched_artist_names: ["Foo Bar"] }),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      artnetImport: {
        internalID: "artnet-import-1",
        state: "COMPLETED",
        totalCount: 10,
        createdCount: 8,
        skippedCount: 1,
        deletedCount: 0,
        errorCount: 1,
        unmatchedArtistNames: ["Foo Bar"],
      },
    })
  })

  it("returns unmatched artist names via the loader when the import is completed", async () => {
    const artnetImportUnmatchedArtistNamesLoader = jest
      .fn()
      .mockResolvedValue({ unmatched_artist_names: ["Alice", "Bob"] })

    const context = {
      artnetImportLoader: () =>
        Promise.resolve({ id: "artnet-import-1", state: "completed" }),
      artnetImportUnmatchedArtistNamesLoader,
    }

    const data = await runAuthenticatedQuery(
      `{ artnetImport(id: "artnet-import-1") { unmatchedArtistNames } }`,
      context
    )

    expect(artnetImportUnmatchedArtistNamesLoader).toHaveBeenCalledWith(
      "artnet-import-1"
    )
    expect(data).toEqual({
      artnetImport: { unmatchedArtistNames: ["Alice", "Bob"] },
    })
  })

  it("returns an empty list without calling the loader while pending or processing", async () => {
    const artnetImportUnmatchedArtistNamesLoader = jest.fn()

    const context = {
      artnetImportLoader: () =>
        Promise.resolve({ id: "artnet-import-1", state: "processing" }),
      artnetImportUnmatchedArtistNamesLoader,
    }

    const data = await runAuthenticatedQuery(
      `{ artnetImport(id: "artnet-import-1") { unmatchedArtistNames } }`,
      context
    )

    expect(artnetImportUnmatchedArtistNamesLoader).not.toHaveBeenCalled()
    expect(data).toEqual({
      artnetImport: { unmatchedArtistNames: [] },
    })
  })
})
