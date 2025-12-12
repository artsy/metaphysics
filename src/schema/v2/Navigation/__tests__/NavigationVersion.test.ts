import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("NavigationVersion", () => {
  describe("live version", () => {
    it("makes a request to the live navigation_group endpoint by default", async () => {
      const query = gql`
        {
          navigationVersion(groupID: "artists") {
            internalID
          }
        }
      `

      const navigationGroupLiveLoader = jest.fn(async () => {
        return {
          id: "artists",
        }
      })

      const context: any = {
        navigationGroupLiveLoader,
      }

      const response = await runQuery(query, context)

      expect(navigationGroupLiveLoader).toHaveBeenCalledWith("artists")

      expect(response).toMatchInlineSnapshot(`
        {
          "navigationVersion": {
            "internalID": "artists",
          },
        }
      `)
    })
  })

  describe("draft version", () => {
    it("makes a request to the draft navigation_group endpoint", async () => {
      const query = gql`
        {
          navigationVersion(groupID: "artists", state: DRAFT) {
            internalID
          }
        }
      `

      const navigationGroupDraftLoader = jest.fn(async () => {
        return {
          id: "artists",
        }
      })

      const context: any = {
        navigationGroupDraftLoader,
      }

      const response = await runQuery(query, context)

      expect(navigationGroupDraftLoader).toHaveBeenCalledWith("artists")

      expect(response).toMatchInlineSnapshot(`
        {
          "navigationVersion": {
            "internalID": "artists",
          },
        }
      `)
    })
  })

  it("returns the correct navigation version, including the full navigation tree", async () => {
    const query = gql`
      {
        navigationVersion(groupID: "artists", state: LIVE) {
          internalID
          items {
            internalID
            title
            href
            children {
              internalID
              title
              href
            }
          }
        }
      }
    `

    const navigationGroupLiveLoader = jest.fn(async () => {
      return {
        id: "artists",
        items: [
          {
            id: "item-1",
            title: "Blue-Chip Artists",
            href: null,
            position: 0,
            children: [
              {
                id: "item-1-1",
                title: "Banksy",
                href: "/artist/banksy",
                position: 0,
              },
              {
                id: "item-1-2",
                title: "Cecily Brown",
                href: "/artist/cecily-brown",
                position: 1,
              },
            ],
          },
          {
            id: "item-2",
            title: "Menu Item without Children",
            href: "/some-href",
            position: 1,
            children: null,
          },
        ],
      }
    })

    const context: any = {
      navigationGroupLiveLoader,
    }

    const response = await runQuery(query, context)

    expect(navigationGroupLiveLoader).toHaveBeenCalledWith("artists")

    expect(response).toMatchInlineSnapshot(`
      {
        "navigationVersion": {
          "internalID": "artists",
          "items": [
            {
              "children": [
                {
                  "href": "/artist/banksy",
                  "internalID": "item-1-1",
                  "title": "Banksy",
                },
                {
                  "href": "/artist/cecily-brown",
                  "internalID": "item-1-2",
                  "title": "Cecily Brown",
                },
              ],
              "href": null,
              "internalID": "item-1",
              "title": "Blue-Chip Artists",
            },
            {
              "children": null,
              "href": "/some-href",
              "internalID": "item-2",
              "title": "Menu Item without Children",
            },
          ],
        },
      }
    `)
  })
})
