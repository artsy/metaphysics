import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RemoveInstallShotFromPartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      removeInstallShotFromPartnerShow(
        input: { showId: "show123", imageId: "image123" }
      ) {
        showOrError {
          __typename
          ... on RemoveInstallShotFromPartnerShowSuccess {
            show {
              internalID
              name
              status
            }
          }
          ... on RemoveInstallShotFromPartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("removes an installation shot from a partner show", async () => {
    const context = {
      removeInstallShotFromPartnerShowLoader: (identifiers) => {
        // Test that we're sending the right data
        expect(identifiers).toEqual({
          showId: "show123",
          imageId: "image123",
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
      removeInstallShotFromPartnerShow: {
        showOrError: {
          __typename: "RemoveInstallShotFromPartnerShowSuccess",
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
