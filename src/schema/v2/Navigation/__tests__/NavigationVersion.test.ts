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
          id: "<internal-id>",
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
            "internalID": "<internal-id>",
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
          id: "<internal-id>",
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
            "internalID": "<internal-id>",
          },
        }
      `)
    })
  })

  describe("fetch by version ID", () => {
    it("makes a request to the navigation_version endpoint with direct ID", async () => {
      const query = gql`
        {
          navigationVersion(id: "version-123") {
            internalID
          }
        }
      `

      const navigationVersionLoader = jest.fn(async () => {
        return {
          id: "version-123",
        }
      })

      const context: any = {
        navigationVersionLoader,
      }

      const response = await runQuery(query, context)

      expect(navigationVersionLoader).toHaveBeenCalledWith("version-123")

      expect(response).toMatchInlineSnapshot(`
        {
          "navigationVersion": {
            "internalID": "version-123",
          },
        }
      `)
    })

    it("returns the full navigation tree when fetching by ID", async () => {
      const query = gql`
        {
          navigationVersion(id: "version-456") {
            internalID
            items {
              internalID
              title
              href
            }
          }
        }
      `

      const navigationVersionLoader = jest.fn(async () => {
        return {
          id: "version-456",
          items: [
            {
              id: "item-1",
              title: "Test Item",
              href: "/test",
              position: 0,
              children: [],
            },
          ],
        }
      })

      const context: any = {
        navigationVersionLoader,
      }

      const response = await runQuery(query, context)

      expect(navigationVersionLoader).toHaveBeenCalledWith("version-456")

      expect(response).toMatchInlineSnapshot(`
        {
          "navigationVersion": {
            "internalID": "version-456",
            "items": [
              {
                "href": "/test",
                "internalID": "item-1",
                "title": "Test Item",
              },
            ],
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
        id: "<internal-id>",
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
                children: [],
              },
              {
                id: "item-1-2",
                title: "Cecily Brown",
                href: "/artist/cecily-brown",
                position: 1,
                children: [],
              },
            ],
          },
          {
            id: "item-2",
            title: "Menu Item without Children",
            href: "/some-href",
            position: 1,
            children: [],
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
          "internalID": "<internal-id>",
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
              "children": [],
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
