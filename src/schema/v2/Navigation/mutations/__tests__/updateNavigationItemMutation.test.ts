import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateNavigationItemMutation", () => {
  const mutation = gql`
    mutation {
      updateNavigationItem(input: { id: "item-123", title: "Updated Title" }) {
        navigationItemOrError {
          ... on UpdateNavigationItemSuccess {
            navigationItem {
              internalID
              title
            }
          }
          ... on UpdateNavigationItemFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const mockUpdateNavigationItemLoader = jest.fn().mockResolvedValue({
    id: "item-123",
    title: "Updated Title",
  })

  const context = {
    updateNavigationItemLoader: mockUpdateNavigationItemLoader,
  }

  it("returns an updated navigation item", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateNavigationItemLoader).toHaveBeenCalledWith("item-123", {
      title: "Updated Title",
    })

    expect(res).toMatchInlineSnapshot(`
      {
        "updateNavigationItem": {
          "navigationItemOrError": {
            "navigationItem": {
              "internalID": "item-123",
              "title": "Updated Title",
            },
          },
        },
      }
    `)
  })

  it("calls the loader with optional fields when provided", async () => {
    const mutationWithOptionalFields = gql`
      mutation {
        updateNavigationItem(
          input: {
            id: "item-123"
            title: "Updated Title"
            href: "/updated-path"
            parent_id: "parent-456"
            position: 5
          }
        ) {
          navigationItemOrError {
            ... on UpdateNavigationItemSuccess {
              navigationItem {
                internalID
                title
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(mutationWithOptionalFields, context)

    expect(mockUpdateNavigationItemLoader).toHaveBeenCalledWith("item-123", {
      title: "Updated Title",
      href: "/updated-path",
      parent_id: "parent-456",
      position: 5,
    })
  })
})
