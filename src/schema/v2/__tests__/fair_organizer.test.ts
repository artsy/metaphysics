import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("fairOrganizer", () => {
  let articlesLoader
  let fairsLoader
  let fairOrganizerLoader
  let profileLoader
  let context = {}

  beforeEach(() => {
    articlesLoader = jest.fn().mockResolvedValue(
      Promise.resolve({
        count: 1,
        results: [
          {
            title: "Example Article",
          },
        ],
      })
    )

    fairOrganizerLoader = jest.fn().mockResolvedValue(
      Promise.resolve({
        id: "the-armory-show",
        name: "The Armory Show",
        website: "https://www.thearmoryshow.com/",
        profile_id: "the-armory-show",
        about:
          "**More Information:**\r\n[http://www.thearmoryshow.com/](http://www.thearmoryshow.com/)",
      })
    )

    fairsLoader = jest.fn().mockResolvedValue(
      Promise.resolve({
        body: [
          {
            _id: "fair-id",
          },
        ],
        headers: { "x-total-count": "1" },
      })
    )

    profileLoader = jest.fn().mockResolvedValue(
      Promise.resolve({
        id: "the-armory-show",
        href: "/the-armory-show",
      })
    )
    context = {
      articlesLoader,
      fairOrganizerLoader,
      fairsLoader,
      profileLoader,
    }
  })

  afterEach(() => {
    articlesLoader.mockClear()
    fairOrganizerLoader.mockClear()
    fairsLoader.mockClear()
    profileLoader.mockClear()
  })

  it("returns a fair organizer", async () => {
    const result = await runQuery(
      gql`
        {
          fairOrganizer(id: "the-armory-show") {
            name
            website
          }
        }
      `,
      context
    )

    expect(result.fairOrganizer).toEqual({
      name: "The Armory Show",
      website: "https://www.thearmoryshow.com/",
    })
  })

  it("supports fetching the fair organizer's profile", async () => {
    const result = await runQuery(
      gql`
        {
          fairOrganizer(id: "the-armory-show") {
            profile {
              href
            }
          }
        }
      `,
      context
    )

    expect(result.fairOrganizer).toEqual({
      profile: { href: "/the-armory-show" },
    })
  })

  it("supports format arguments for about content", async () => {
    const result = await runQuery(
      gql`
        {
          fairOrganizer(id: "the-armory-show") {
            about(format: HTML)
          }
        }
      `,
      context
    )

    expect(result.fairOrganizer).toEqual({
      about:
        '<p><strong>More Information:</strong><br><a href="http://www.thearmoryshow.com/">http://www.thearmoryshow.com/</a></p>',
    })
  })

  it("supports an articles connection", async () => {
    const result = await runQuery(
      gql`
        {
          fairOrganizer(id: "the-armory-show") {
            articlesConnection(first: 5) {
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      `,
      context
    )

    expect(fairsLoader).toBeCalledWith({
      fair_organizer_id: "the-armory-show",
      size: 100,
    })
    expect(articlesLoader).toBeCalledWith({
      count: true,
      fair_ids: ["fair-id"],
      in_editorial_feed: undefined,
      limit: 5,
      offset: 0,
      published: true,
      sort: undefined,
    })

    expect(result.fairOrganizer.articlesConnection).toEqual({
      edges: [
        {
          node: {
            title: "Example Article",
          },
        },
      ],
    })
  })

  it("supports a fairs connection", async () => {
    const result = await runQuery(
      gql`
        {
          fairOrganizer(id: "the-armory-show") {
            fairsConnection(first: 5) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `,
      context
    )

    expect(fairsLoader).toBeCalledWith({
      fair_organizer_id: "the-armory-show",
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(result.fairOrganizer.fairsConnection).toEqual({
      edges: [
        {
          node: {
            internalID: "fair-id",
          },
        },
      ],
    })
  })

  it("passes args to gravity", async () => {
    await runQuery(
      gql`
        {
          fairOrganizer(id: "the-armory-show") {
            profile {
              href
            }
          }
        }
      `,
      context
    )

    expect(fairOrganizerLoader).toBeCalledTimes(1)
    expect(profileLoader).toBeCalledTimes(1)
    expect(fairOrganizerLoader).toBeCalledWith("the-armory-show")
    expect(profileLoader).toBeCalledWith("the-armory-show")
  })
})
