import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createArtnetImport mutation", () => {
  const query = `
    mutation {
      createArtnetImport(input: { partnerID: "some-gallery" }) {
        artnetImportOrError {
          ... on CreateArtnetImportSuccess {
            queued
            artnetImportID
          }
          ... on CreateArtnetImportFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("returns queued and artnetImportID on success", async () => {
    const context = {
      createArtnetImportLoader: () =>
        Promise.resolve({ queued: true, artnet_import_id: "abc123" }),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      createArtnetImport: {
        artnetImportOrError: {
          queued: true,
          artnetImportID: "abc123",
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      createArtnetImportLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/artnet_import - {"type":"error","message":"Unauthorized"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      createArtnetImport: {
        artnetImportOrError: {
          mutationError: {
            type: "error",
            message: "Unauthorized",
          },
        },
      },
    })
  })
})
