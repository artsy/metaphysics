import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateInstallShotForPartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      updateInstallShotForPartnerShow(
        input: {
          showId: "show123"
          imageId: "image123"
          caption: "Updated caption for opening night"
        }
      ) {
        showOrError {
          __typename
          ... on UpdateInstallShotForPartnerShowSuccess {
            show {
              internalID
              name
              status
            }
          }
          ... on UpdateInstallShotForPartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates an installation shot caption for a partner show", async () => {
    const context = {
      updateInstallShotLoader: (identifiers, data) => {
        // Test that we're sending the right data
        expect(identifiers).toEqual({
          showId: "show123",
          imageId: "image123",
        })
        expect(data).toEqual({
          caption: "Updated caption for opening night",
        })

        return Promise.resolve({})
      },
      showLoader: () =>
        Promise.resolve({
          _id: "show123",
          name: "Sample Show",
          status: "running",
        }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updateInstallShotForPartnerShow: {
        showOrError: {
          __typename: "UpdateInstallShotForPartnerShowSuccess",
          show: {
            internalID: "show123",
            name: "Sample Show",
            status: "running",
          },
        },
      },
    })
  })
})
