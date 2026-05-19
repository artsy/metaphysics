import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("SyncCatalogToArtworkMutation", () => {
  const mutation = gql`
    mutation {
      syncCatalogToArtwork(input: { artworkID: "artwork-123" }) {
        artworkOrError {
          __typename
          ... on SyncCatalogToArtworkSuccess {
            artwork {
              internalID
            }
            syncedFields
            syncErrors
          }
          ... on SyncCatalogToArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  describe("on success", () => {
    it("returns artwork, synced fields, and errors", async () => {
      const context = {
        syncCatalogToArtworkLoader: jest.fn(() =>
          Promise.resolve({
            success: true,
            synced_fields: ["availability", "medium", "price"],
            errors: [],
          })
        ),
        artworkLoader: jest.fn(() =>
          Promise.resolve({ _id: "artwork-123", id: "artwork-slug" })
        ),
      }

      const result = await runAuthenticatedQuery(mutation, context)

      expect(context.artworkLoader).toHaveBeenCalledWith("artwork-123")
      expect(result).toEqual({
        syncCatalogToArtwork: {
          artworkOrError: {
            __typename: "SyncCatalogToArtworkSuccess",
            artwork: {
              internalID: "artwork-123",
            },
            syncedFields: ["availability", "medium", "price"],
            syncErrors: [],
          },
        },
      })
    })

    it("returns partial sync errors", async () => {
      const context = {
        syncCatalogToArtworkLoader: jest.fn(() =>
          Promise.resolve({
            success: false,
            synced_fields: ["price"],
            errors: ["Availability 'on hold' is not syncable"],
          })
        ),
        artworkLoader: jest.fn(() =>
          Promise.resolve({ _id: "artwork-123", id: "artwork-slug" })
        ),
      }

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toEqual({
        syncCatalogToArtwork: {
          artworkOrError: {
            __typename: "SyncCatalogToArtworkSuccess",
            artwork: {
              internalID: "artwork-123",
            },
            syncedFields: ["price"],
            syncErrors: ["Availability 'on hold' is not syncable"],
          },
        },
      })
    })
  })

  describe("with fields parameter", () => {
    const fieldsQuery = gql`
      mutation {
        syncCatalogToArtwork(
          input: { artworkID: "artwork-123", fields: [PRICE] }
        ) {
          artworkOrError {
            __typename
            ... on SyncCatalogToArtworkSuccess {
              syncedFields
            }
          }
        }
      }
    `

    it("forwards fields to the loader", async () => {
      const context = {
        syncCatalogToArtworkLoader: jest.fn(() =>
          Promise.resolve({
            success: true,
            synced_fields: ["price"],
            errors: [],
          })
        ),
        artworkLoader: jest.fn(() =>
          Promise.resolve({ _id: "artwork-123", id: "artwork-slug" })
        ),
      }

      await runAuthenticatedQuery(fieldsQuery, context)

      expect(
        context.syncCatalogToArtworkLoader
      ).toHaveBeenCalledWith("artwork-123", { fields: ["price"] })
    })

    it("passes empty params when fields is omitted", async () => {
      const context = {
        syncCatalogToArtworkLoader: jest.fn(() =>
          Promise.resolve({
            success: true,
            synced_fields: ["availability", "medium", "price"],
            errors: [],
          })
        ),
        artworkLoader: jest.fn(() =>
          Promise.resolve({ _id: "artwork-123", id: "artwork-slug" })
        ),
      }

      await runAuthenticatedQuery(mutation, context)

      expect(context.syncCatalogToArtworkLoader).toHaveBeenCalledWith(
        "artwork-123",
        {}
      )
    })
  })

  describe("on API failure", () => {
    it("returns a mutation error", async () => {
      const context = {
        syncCatalogToArtworkLoader: jest.fn(() =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/catalog_artwork/artwork-123/sync_to_artwork - {"type":"error","message":"Artwork not found"}`
            )
          )
        ),
      }

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toEqual({
        syncCatalogToArtwork: {
          artworkOrError: {
            __typename: "SyncCatalogToArtworkFailure",
            mutationError: {
              message: "Artwork not found",
            },
          },
        },
      })
    })
  })

  describe("when unauthenticated", () => {
    it("returns an error", async () => {
      const context = {
        syncCatalogToArtworkLoader: undefined,
      }

      await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
        "You need to be signed in to perform this action"
      )
    })
  })
})
