import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createNavigationItemMutation", () => {
  const mutation = gql`
    mutation {
      createNavigationItem(
        input: { versionID: "version-123", title: "Artworks" }
      ) {
        navigationItemOrError {
          ... on CreateNavigationItemSuccess {
            navigationItem {
              internalID
              title
            }
          }
          ... on CreateNavigationItemFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const mockCreateNavigationItemLoader = jest.fn().mockResolvedValue({
    id: "item-123",
    title: "Artworks",
  })

  const context = {
    createNavigationItemLoader: mockCreateNavigationItemLoader,
  }

  it("returns a created navigation item", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(mockCreateNavigationItemLoader).toHaveBeenCalledWith({
      navigation_version_id: "version-123",
      title: "Artworks",
    })

    expect(res).toMatchInlineSnapshot(`
      {
        "createNavigationItem": {
          "navigationItemOrError": {
            "navigationItem": {
              "internalID": "item-123",
              "title": "Artworks",
            },
          },
        },
      }
    `)
  })

  it("calls the loader with href and parentID when provided", async () => {
    const mutationWithOptionalFields = gql`
      mutation {
        createNavigationItem(
          input: {
            versionID: "version-123"
            title: "Artworks"
            href: "/artworks"
            parentID: "parent-456"
          }
        ) {
          navigationItemOrError {
            ... on CreateNavigationItemSuccess {
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

    expect(mockCreateNavigationItemLoader).toHaveBeenCalledWith({
      navigation_version_id: "version-123",
      title: "Artworks",
      href: "/artworks",
      parent_id: "parent-456",
    })
  })
})
