import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("finalizeArtnetImport mutation", () => {
  const query = `
    mutation {
      finalizeArtnetImport(input: { artnetImportID: "artnet-import-1" }) {
        finalizeArtnetImportOrError {
          ... on FinalizeArtnetImportSuccess {
            artnetImport {
              internalID
              state
            }
          }
          ... on FinalizeArtnetImportFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("starts finalizing the import", async () => {
    const updateArtnetImportLoader = jest
      .fn()
      .mockResolvedValue({ id: "artnet-import-1", state: "finalizing" })

    const data = await runAuthenticatedQuery(query, {
      updateArtnetImportLoader,
    })

    expect(updateArtnetImportLoader).toHaveBeenCalledWith("artnet-import-1", {
      state: "finalized",
    })
    expect(data).toEqual({
      finalizeArtnetImport: {
        finalizeArtnetImportOrError: {
          artnetImport: {
            internalID: "artnet-import-1",
            state: "FINALIZING",
          },
        },
      },
    })
  })

  it("returns a mutation error when the import is already finalized", async () => {
    const updateArtnetImportLoader = () =>
      Promise.reject(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artnet_import/artnet-import-1 - {"type":"error","message":"Artnet import is already finalized"}`
        )
      )

    const data = await runAuthenticatedQuery(query, {
      updateArtnetImportLoader,
    })

    expect(data).toEqual({
      finalizeArtnetImport: {
        finalizeArtnetImportOrError: {
          mutationError: {
            type: "error",
            message: "Artnet import is already finalized",
          },
        },
      },
    })
  })
})
