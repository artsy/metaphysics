import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteNavigationItemMutation", () => {
  const mutation = gql`
    mutation {
      deleteNavigationItem(input: { id: "item-123" }) {
        navigationItemOrError {
          ... on DeleteNavigationItemSuccess {
            navigationItem {
              internalID
              title
            }
          }
          ... on DeleteNavigationItemFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const mockDeleteNavigationItemLoader = jest.fn().mockResolvedValue({
    id: "item-123",
    title: "Deleted Item",
  })

  const context = {
    deleteNavigationItemLoader: mockDeleteNavigationItemLoader,
  }

  it("returns a deleted navigation item", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(mockDeleteNavigationItemLoader).toHaveBeenCalledWith("item-123")

    expect(res).toMatchInlineSnapshot(`
      {
        "deleteNavigationItem": {
          "navigationItemOrError": {
            "navigationItem": {
              "internalID": "item-123",
              "title": "Deleted Item",
            },
          },
        },
      }
    `)
  })
})
