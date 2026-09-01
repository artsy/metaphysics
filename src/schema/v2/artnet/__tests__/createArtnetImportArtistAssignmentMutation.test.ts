import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createArtnetImportArtistAssignment mutation", () => {
  const query = `
    mutation {
      createArtnetImportArtistAssignment(
        input: {
          artnetImportID: "artnet-import-1"
          artistName: "Foo Bar"
          artistID: "foo-bar-id"
        }
      ) {
        createArtnetImportArtistAssignmentOrError {
          ... on CreateArtnetImportArtistAssignmentSuccess {
            artnetImportID
            matchedRowsCount
            updatedArtworksCount
            artnetImport {
              internalID
            }
          }
          ... on CreateArtnetImportArtistAssignmentFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("assigns the artist and returns the updated counts", async () => {
    const artnetImportCreateArtistAssignmentLoader = jest
      .fn()
      .mockResolvedValue({
        matched_rows_count: 3,
        updated_artworks_count: 2,
        skipped_already_assigned_artwork_ids: ["a1"],
        missing_artnet_artwork_ids: [],
        failed_artwork_ids: [],
      })

    const context = {
      artnetImportCreateArtistAssignmentLoader,
      artnetImportLoader: () =>
        Promise.resolve({ id: "artnet-import-1", state: "completed" }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(artnetImportCreateArtistAssignmentLoader).toHaveBeenCalledWith(
      "artnet-import-1",
      {
        artist_name: "Foo Bar",
        artist_id: "foo-bar-id",
      }
    )
    expect(data).toEqual({
      createArtnetImportArtistAssignment: {
        createArtnetImportArtistAssignmentOrError: {
          artnetImportID: "artnet-import-1",
          matchedRowsCount: 3,
          updatedArtworksCount: 2,
          artnetImport: {
            internalID: "artnet-import-1",
          },
        },
      },
    })
  })

  it("returns a mutation error when there are no unresolved matches", async () => {
    const context = {
      artnetImportCreateArtistAssignmentLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/artnet_import/artnet-import-1/artist_assignments - {"type":"error","message":"No unresolved artworks found for this artist name"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      createArtnetImportArtistAssignment: {
        createArtnetImportArtistAssignmentOrError: {
          mutationError: {
            type: "error",
            message: "No unresolved artworks found for this artist name",
          },
        },
      },
    })
  })
})
