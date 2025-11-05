import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtworksMutation", () => {
  it("creates artworks asynchronously and returns queued status", async () => {
    const artworkImportCreateArtworksLoader = jest.fn().mockResolvedValue({
      queued: true,
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtworks(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtworksOrError {
            ... on CreateArtworkImportArtworksSuccess {
              queued
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtworksLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportCreateArtworksLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {}
    )

    expect(result).toEqual({
      createArtworkImportArtworks: {
        createArtworkImportArtworksOrError: {
          queued: true,
        },
      },
    })
  })

  it("handles queued response correctly", async () => {
    const artworkImportCreateArtworksLoader = jest.fn().mockResolvedValue({
      queued: true,
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtworks(
          input: { artworkImportID: "artwork-import-2" }
        ) {
          createArtworkImportArtworksOrError {
            ... on CreateArtworkImportArtworksSuccess {
              queued
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtworksLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportCreateArtworksLoader).toHaveBeenCalledWith(
      "artwork-import-2",
      {}
    )

    expect(result).toEqual({
      createArtworkImportArtworks: {
        createArtworkImportArtworksOrError: {
          queued: true,
        },
      },
    })
  })

  it("handles errors correctly", async () => {
    const artworkImportCreateArtworksLoader = jest
      .fn()
      .mockRejectedValue(new Error("Test error"))

    const mutation = gql`
      mutation {
        createArtworkImportArtworks(
          input: { artworkImportID: "artwork-import-error" }
        ) {
          createArtworkImportArtworksOrError {
            ... on CreateArtworkImportArtworksFailure {
              mutationError {
                type
                message
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtworksLoader,
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Test error"
    )

    expect(artworkImportCreateArtworksLoader).toHaveBeenCalledWith(
      "artwork-import-error",
      {}
    )
  })
})
