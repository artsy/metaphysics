import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerShow(
        input: {
          partnerId: "partner123"
          name: "Test Show"
          featured: true
          startAt: "2025-01-01T00:00:00+00:00"
          endAt: "2025-02-01T00:00:00+00:00"
        }
      ) {
        showOrError {
          __typename
          ... on CreatePartnerShowSuccess {
            show {
              internalID
              name
            }
          }
        }
      }
    }
  `

  it("creates a partner show", async () => {
    const context = {
      createPartnerShowLoader: () =>
        Promise.resolve({
          _id: "show123",
          name: "Test Show",
        }),
    }

    const createdShow = await runAuthenticatedQuery(mutation, context)

    expect(createdShow).toEqual({
      createPartnerShow: {
        showOrError: {
          __typename: "CreatePartnerShowSuccess",
          show: {
            internalID: "show123",
            name: "Test Show",
          },
        },
      },
    })
  })
})
