import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("navigationGroup", () => {
  it("returns a navigation group", async () => {
    const query = gql`
      {
        navigationGroup(id: "artists") {
          internalID
          name
          liveVersion {
            internalID
          }
          draftVersion {
            internalID
          }
          createdAt
          updatedAt
        }
      }
    `

    const context = {
      navigationGroupLoader: jest.fn().mockResolvedValue({
        body: {
          id: "artists",
          name: "Artists",
          live_version_id: "live-version-id",
          draft_version_id: "draft-version-id",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      }),
      navigationGroupLiveLoader: jest.fn().mockResolvedValue({
        id: "live-version-id",
      }),
      navigationGroupDraftLoader: jest.fn().mockResolvedValue({
        id: "draft-version-id",
      }),
    } as any

    const response = await runQuery(query, context)

    expect(response).toMatchInlineSnapshot(`
      {
        "navigationGroup": {
          "createdAt": "2025-01-01T00:00:00Z",
          "draftVersion": {
            "internalID": "draft-version-id",
          },
          "internalID": "artists",
          "liveVersion": {
            "internalID": "live-version-id",
          },
          "name": "Artists",
          "updatedAt": "2025-01-01T00:00:00Z",
        },
      }
    `)
  })
})

describe("navigationGroups", () => {
  it("returns a list of navigation groups", async () => {
    const query = gql`
      {
        navigationGroups {
          internalID
        }
      }
    `

    const context = {
      navigationGroupsLoader: jest.fn().mockResolvedValue({
        body: [
          {
            id: "whats-new",
          },
          {
            id: "artists",
          },
          {
            id: "artworks",
          },
        ],
      }),
    } as any

    const response = await runQuery(query, context)

    expect(response).toMatchInlineSnapshot(`
      {
        "navigationGroups": [
          {
            "internalID": "whats-new",
          },
          {
            "internalID": "artists",
          },
          {
            "internalID": "artworks",
          },
        ],
      }
    `)
  })
})
