import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("fairOrganizer", () => {
  const query = gql`
    {
      fairOrganizer(id: "the-armory-show") {
        name
        website
        profile {
          href
        }
      }
    }
  `
  const fairOrganizerLoader = jest.fn().mockResolvedValue(
    Promise.resolve({
      id: "the-armory-show",
      name: "The Armory Show",
      website: "https://www.thearmoryshow.com/",
      profile_id: "the-armory-show",
    })
  )
  const profileLoader = jest.fn().mockResolvedValue(
    Promise.resolve({
      id: "the-armory-show",
      href: "/the-armory-show",
    })
  )

  const context = {
    fairOrganizerLoader: fairOrganizerLoader,
    profileLoader: profileLoader,
  }

  afterEach(() => {
    fairOrganizerLoader.mockClear()
    profileLoader.mockClear()
  })

  it("returns a fair organizer", async () => {
    const result = await runQuery(query, context)

    expect(result.fairOrganizer).toEqual({
      name: "The Armory Show",
      website: "https://www.thearmoryshow.com/",
      profile: { href: "/the-armory-show" },
    })
  })

  it("passes args to gravity", async () => {
    await runQuery(query, context)

    expect(fairOrganizerLoader).toBeCalledTimes(1)
    expect(profileLoader).toBeCalledTimes(1)
    expect(fairOrganizerLoader).toBeCalledWith("the-armory-show")
    expect(profileLoader).toBeCalledWith("the-armory-show")
  })
})
