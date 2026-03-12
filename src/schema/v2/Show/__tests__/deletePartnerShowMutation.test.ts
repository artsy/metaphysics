import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerShow(input: { partnerId: "partner123", showId: "show123" }) {
        showOrError {
          __typename
          ... on DeletePartnerShowSuccess {
            show {
              internalID
              name
            }
          }
        }
      }
    }
  `

  it("deletes a partner show", async () => {
    const context = {
      deletePartnerShowLoader: () =>
        Promise.resolve({
          _id: "show123",
          name: "Deleted Show",
        }),
    }

    const deletedShow = await runAuthenticatedQuery(mutation, context)

    expect(deletedShow).toEqual({
      deletePartnerShow: {
        showOrError: {
          __typename: "DeletePartnerShowSuccess",
          show: {
            internalID: "show123",
            name: "Deleted Show",
          },
        },
      },
    })
  })

  describe("without partnerId (partner-less reference show)", () => {
    const partnerlessMutation = gql`
      mutation {
        deletePartnerShow(input: { showId: "ref-show-456" }) {
          showOrError {
            __typename
            ... on DeletePartnerShowSuccess {
              show {
                internalID
                name
              }
            }
          }
        }
      }
    `

    it("uses the top-level show loader", async () => {
      const context = {
        deletePartnerShowLoader: jest.fn(),
        deleteShowLoader: () =>
          Promise.resolve({
            _id: "ref-show-456",
            name: "Deleted Reference Show",
          }),
      }

      const result = await runAuthenticatedQuery(partnerlessMutation, context)

      expect(context.deletePartnerShowLoader).not.toHaveBeenCalled()
      expect(result).toEqual({
        deletePartnerShow: {
          showOrError: {
            __typename: "DeletePartnerShowSuccess",
            show: {
              internalID: "ref-show-456",
              name: "Deleted Reference Show",
            },
          },
        },
      })
    })
  })
})
