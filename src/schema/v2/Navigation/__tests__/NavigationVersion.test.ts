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

  describe("featuredLinksSet", () => {
    it("calls setItemsLoader with ordered_set_id and returns items.body as FeaturedLink list", async () => {
      const setBody = [
        {
          id: "link-1",
          href: "/featured/one",
          title: "Featured One",
          subtitle: "Subtitle one",
        },
        {
          id: "link-2",
          href: "/featured/two",
          title: "Featured Two",
          subtitle: "Subtitle two",
        },
      ]
      const setItemsLoader = jest.fn(async () => ({
        body: setBody,
        headers: {},
      }))
      const navigationVersionLoader = jest.fn(async () => ({
        id: "version-with-featured",
        ordered_set_id: "ordered-set-123",
      }))

      const query = gql`
        {
          navigationVersion(id: "version-with-featured") {
            internalID
            featuredLinksSet {
              internalID
              href
              title
              subtitle
            }
          }
        }
      `
      const response = await runQuery(query, {
        navigationVersionLoader,
        setItemsLoader,
      })

      expect(navigationVersionLoader).toHaveBeenCalledWith(
        "version-with-featured"
      )
      expect(setItemsLoader).toHaveBeenCalledWith("ordered-set-123")
      expect(response.navigationVersion.featuredLinksSet).toHaveLength(2)
      expect(response.navigationVersion.featuredLinksSet[0]).toMatchObject({
        internalID: "link-1",
        href: "/featured/one",
        title: "Featured One",
        subtitle: "Subtitle one",
      })
      expect(response.navigationVersion.featuredLinksSet[1]).toMatchObject({
        internalID: "link-2",
        href: "/featured/two",
        title: "Featured Two",
        subtitle: "Subtitle two",
      })
    })

    it("returns empty array when set has no items", async () => {
      const setItemsLoader = jest.fn(async () => ({ body: [], headers: {} }))
      const navigationVersionLoader = jest.fn(async () => ({
        id: "version-empty-featured",
        ordered_set_id: "ordered-set-empty",
      }))

      const query = gql`
        {
          navigationVersion(id: "version-empty-featured") {
            internalID
            featuredLinksSet {
              internalID
              title
            }
          }
        }
      `
      const response = await runQuery(query, {
        navigationVersionLoader,
        setItemsLoader,
      })

      expect(setItemsLoader).toHaveBeenCalledWith("ordered-set-empty")
      expect(response.navigationVersion.featuredLinksSet).toEqual([])
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
