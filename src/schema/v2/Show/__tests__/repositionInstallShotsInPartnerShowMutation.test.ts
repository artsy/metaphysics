import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RepositionInstallShotsInPartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      repositionInstallShotsInPartnerShow(
        input: { showId: "show123", imageIds: ["image1", "image2", "image3"] }
      ) {
        showOrError {
          __typename
          ... on RepositionInstallShotsInPartnerShowSuccess {
            show {
              internalID
              name
              status
            }
          }
          ... on RepositionInstallShotsInPartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("repositions installation shots in a partner show", async () => {
    const context = {
      repositionInstallShotsInPartnerShowLoader: (identifiers, data) => {
        // Test that we're sending the right data
        expect(identifiers).toEqual({
          showId: "show123",
        })
        expect(data).toEqual({
          image_ids: ["image1", "image2", "image3"],
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
      repositionInstallShotsInPartnerShow: {
        showOrError: {
          __typename: "RepositionInstallShotsInPartnerShowSuccess",
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
