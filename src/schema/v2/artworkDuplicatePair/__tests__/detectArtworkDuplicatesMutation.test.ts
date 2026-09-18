import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("detectArtworkDuplicatesMutation", () => {
  it("triggers detection", async () => {
    const detectArtworkDuplicatesLoader = jest.fn().mockResolvedValue({
      status: "processing",
      partner_id: "partner-1",
      detection_version: "v1",
    })

    const mutation = gql`
      mutation {
        detectArtworkDuplicates(
          input: { partnerId: "partner-1", detectionVersion: "v1" }
        ) {
          detectArtworkDuplicatesResponseOrError {
            ... on DetectArtworkDuplicatesSuccess {
              status
              partnerId
              detectionVersion
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, {
      detectArtworkDuplicatesLoader,
    })

    expect(detectArtworkDuplicatesLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      detection_version: "v1",
    })

    expect(
      result.detectArtworkDuplicates.detectArtworkDuplicatesResponseOrError
    ).toEqual({
      status: "processing",
      partnerId: "partner-1",
      detectionVersion: "v1",
    })
  })

  it("scopes detection to an artnet import and echoes the id back", async () => {
    const detectArtworkDuplicatesLoader = jest.fn().mockResolvedValue({
      status: "processing",
      partner_id: "partner-1",
      detection_version: "exact_v1",
      artnet_import_id: "import-1",
    })

    const mutation = gql`
      mutation {
        detectArtworkDuplicates(
          input: { partnerId: "partner-1", artnetImportID: "import-1" }
        ) {
          detectArtworkDuplicatesResponseOrError {
            ... on DetectArtworkDuplicatesSuccess {
              status
              partnerId
              artnetImportID
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, {
      detectArtworkDuplicatesLoader,
    })

    expect(detectArtworkDuplicatesLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      artnet_import_id: "import-1",
    })

    expect(
      result.detectArtworkDuplicates.detectArtworkDuplicatesResponseOrError
    ).toEqual({
      status: "processing",
      partnerId: "partner-1",
      artnetImportID: "import-1",
    })
  })

  it("returns an error when gravity fails", async () => {
    const detectArtworkDuplicatesLoader = jest
      .fn()
      .mockRejectedValue(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artwork_duplicate_pair/detect - {"type":"param_error","message":"Partner not found"}`
        )
      )

    const mutation = gql`
      mutation {
        detectArtworkDuplicates(input: { partnerId: "bad-partner" }) {
          detectArtworkDuplicatesResponseOrError {
            __typename
            ... on DetectArtworkDuplicatesFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, {
      detectArtworkDuplicatesLoader,
    })

    expect(
      result.detectArtworkDuplicates.detectArtworkDuplicatesResponseOrError
    ).toEqual({
      __typename: "DetectArtworkDuplicatesFailure",
      mutationError: {
        message: "Partner not found",
      },
    })
  })
})
