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

  it("creates a fair booth show without endAt", async () => {
    const fairShowMutation = gql`
      mutation {
        createPartnerShow(
          input: {
            partnerId: "partner123"
            name: "Fair Booth"
            fairId: "fair123"
            startAt: "2025-01-01T00:00:00+00:00"
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

    const context = {
      createPartnerShowLoader: () =>
        Promise.resolve({
          _id: "show456",
          name: "Fair Booth",
        }),
    }

    const createdShow = await runAuthenticatedQuery(fairShowMutation, context)

    expect(createdShow).toEqual({
      createPartnerShow: {
        showOrError: {
          __typename: "CreatePartnerShowSuccess",
          show: {
            internalID: "show456",
            name: "Fair Booth",
          },
        },
      },
    })
  })

  it("returns error when creating a non-fair show without endAt", async () => {
    const invalidMutation = gql`
      mutation {
        createPartnerShow(
          input: {
            partnerId: "partner123"
            name: "Invalid Show"
            startAt: "2025-01-01T00:00:00+00:00"
          }
        ) {
          showOrError {
            __typename
            ... on CreatePartnerShowFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const context = {
      createPartnerShowLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(invalidMutation, context)

    expect(result).toEqual({
      createPartnerShow: {
        showOrError: {
          __typename: "CreatePartnerShowFailure",
          mutationError: {
            message: "endAt is required for non-fair shows",
          },
        },
      },
    })
    expect(context.createPartnerShowLoader).not.toHaveBeenCalled()
  })
})
