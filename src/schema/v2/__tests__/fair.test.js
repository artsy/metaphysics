const mockSponsoredContent = {
  fairs: {
    "the-armory-show-2017": {
      activationText: "Lorem ipsum dolor sit amet",
      pressReleaseUrl: "https://www.example.com",
    },
  },
}

jest.mock("lib/sponsoredContent/data.json", () => mockSponsoredContent)

/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import moment from "moment"

describe("Fair type", () => {
  const fair = {
    id: "the-armory-show-2017",
    name: "The Armory Show 2017",
    organizer: {
      profile_id: "the-armory-show",
    },
    mobile_image: {
      image_url: "circle-image.jpg",
    },
  }

  let query = gql`
    {
      fair(id: "the-armory-show-2017") {
        slug
        name
        organizer {
          profileID
          profile {
            isPubliclyVisible
          }
        }
        mobileImage {
          imageURL
        }
      }
    }
  `

  let context = {
    fairLoader: sinon.stub().returns(Promise.resolve(fair)),
  }

  it("is_publically_visible returns true when profile is published", () => {
    const profile = {
      id: "the-armory-show",
      published: true,
      private: false,
    }

    context.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, context).then(data => {
      expect(data).toEqual({
        fair: {
          slug: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profileID: "the-armory-show",
            profile: {
              isPubliclyVisible: true,
            },
          },
          mobileImage: {
            imageURL: "circle-image.jpg",
          },
        },
      })
    })
  })

  it("is_publically_visible returns false when profile is not published", () => {
    const profile = {
      id: "context",
      published: false,
      private: false,
    }

    context.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, context).then(data => {
      expect(data).toEqual({
        fair: {
          slug: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profileID: "the-armory-show",
            profile: {
              isPubliclyVisible: false,
            },
          },
          mobileImage: {
            imageURL: "circle-image.jpg",
          },
        },
      })
    })
  })

  it("is_publically_visible returns false when profile is not published", () => {
    const profile = {
      id: "context",
      published: false,
      private: false,
    }

    context.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, context).then(data => {
      expect(data).toEqual({
        fair: {
          slug: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profileID: "the-armory-show",
            profile: {
              isPubliclyVisible: false,
            },
          },
          mobileImage: {
            imageURL: "circle-image.jpg",
          },
        },
      })
    })
  })

  it("includes sponsored content", async () => {
    query = gql`
      {
        fair(id: "the-armory-show-2017") {
          sponsoredContent {
            activationText
            pressReleaseUrl
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(result.fair.sponsoredContent).toEqual({
      activationText: "Lorem ipsum dolor sit amet",
      pressReleaseUrl: "https://www.example.com",
    })
  })
})

describe("Fair", () => {
  let context = null
  beforeEach(() => {
    const data = {
      fair: {
        _id: 123,
        id: "aqua-art-miami-2018",
        artists_count: 1,
        artworks_count: 2,
        partners_count: 3,
        start_at: "2019-02-15T23:00:00+00:00",
        end_at: "2019-02-17T11:00:00+00:00",
        partner_shows_count: 4,
        name: "Aqua Art Miami 2018",
        exhibitors_grouped_by_name: [
          {
            letter: "A",
            exhibitors: [
              {
                name: "ArtHelix Gallery",
                id: "arthelix-gallery",
                profile_id: "arthelix-gallery",
                partner_id: "1234567890",
              },
            ],
          },
        ],
      },
    }
    context = {
      fairLoader: sinon.stub().returns(Promise.resolve(data.fair)),
      fairArtistsLoader: jest.fn().mockReturnValue(
        Promise.resolve({
          body: [
            {
              id: "foo-artist",
              name: "Foo Artist",
            },
          ],
          headers: {
            "x-total-count": 1,
          },
        })
      ),
      fairBoothsLoader: jest.fn().mockReturnValue(
        Promise.resolve({
          body: {
            results: [
              {
                id: "abxy-blk-and-blue",
              },
            ],
            next: "1234567890",
          },
        })
      ),
      artistsLoader: jest.fn().mockReturnValue(
        Promise.resolve([
          {
            name: "Foo Artist",
            id: "foo-artist",
          },
        ])
      ),
      fairPartnersLoader: sinon.stub().returns(
        Promise.resolve({
          body: {
            name: "ArtHelix Gallery",
            id: "arthelix-gallery",
            partner_id: "1234567890",
            partner_show_ids: ["arthelix-gallery"],
          },
          headers: {
            "x-total-count": 1,
          },
        })
      ),
    }
  })

  it("includes returns fair exhibitors grouped alphanumerically", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          slug
          name
          exhibitorsGroupedByName {
            letter
            exhibitors {
              name
              slug
              partnerID
              profileID
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      fair: {
        slug: "aqua-art-miami-2018",
        name: "Aqua Art Miami 2018",
        exhibitorsGroupedByName: [
          {
            letter: "A",
            exhibitors: [
              {
                name: "ArtHelix Gallery",
                slug: "arthelix-gallery",
                partnerID: "1234567890",
                profileID: "arthelix-gallery",
              },
            ],
          },
        ],
      },
    })
  })

  it("Shows connection uses gravity cursor", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          shows: showsConnection(first: 0, after: "") {
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      fair: {
        shows: {
          pageInfo: {
            endCursor: "1234567890",
            hasNextPage: true,
          },
        },
      },
    })
  })

  it("includes a formatted exhibition period", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          exhibitionPeriod
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      fair: {
        exhibitionPeriod: "Feb 15 – 17, 2019",
      },
    })
  })

  it("includes artists associated with the fair", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          artistsConnection(first: 1) {
            edges {
              node {
                slug
                name
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      fair: {
        artistsConnection: {
          edges: [
            {
              node: {
                slug: "foo-artist",
                name: "Foo Artist",
              },
            },
          ],
        },
      },
    })
  })

  describe("isActive flag", () => {
    describe("when active_start_at and end_at are in the past", () => {
      it("is false ", async () => {
        const mockFair = {
          id: "this-fair-was-active",
          active_start_at: moment()
            .subtract(14, "days")
            .toISOString(),
          end_at: moment()
            .subtract(7, "days")
            .toISOString(),
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(mockFair))
        context = {
          fairLoader: mockFairLoader,
        }

        const query = gql`
          {
            fair(id: "this-fair-was-active") {
              isActive
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            isActive: true,
          },
        })
      })
    })

    describe("when active_start_at is in the past and end_at is in the future", () => {
      it("is true ", async () => {
        const mockFair = {
          id: "this-fair-is-active",
          active_start_at: moment()
            .subtract(7, "days")
            .toISOString(),
          end_at: moment()
            .add(7, "days")
            .toISOString(),
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(mockFair))
        context = {
          fairLoader: mockFairLoader,
        }

        const query = gql`
          {
            fair(id: "this-fair-is-active") {
              isActive
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            isActive: true,
          },
        })
      })
    })

    describe("when active_start_at and end_at are in the future", () => {
      it("is false ", async () => {
        const mockFair = {
          id: "this-fair-not-yet-active",
          active_start_at: moment()
            .add(7, "days")
            .toISOString(),
          end_at: moment()
            .add(14, "days")
            .toISOString(),
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(mockFair))
        context = {
          fairLoader: mockFairLoader,
        }

        const query = gql`
          {
            fair(id: "this-fair-not-yet-active") {
              isActive
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            isActive: false,
          },
        })
      })
    })
  })

  describe("formattedOpeningHours", () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          formattedOpeningHours
        }
      }
    `

    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2019-01-30T03:24:00")
    })
    afterEach(() => {
      Date.now = realNow
    })

    describe("with future dates", () => {
      it("The fair is opening on the hour", async () => {
        const fairData = {
          start_at: "2019-02-06T12:00:56+00:00",
          end_at: "2019-02-30T12:34:56+00:00",
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(fairData))
        context = {
          fairLoader: mockFairLoader,
        }

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            formattedOpeningHours: "Opens Feb 6 at 12:00pm UTC",
          },
        })
      })

      it("The fair is opening with minutes", async () => {
        const fairData = {
          start_at: "2019-02-06T12:30:56+00:00",
          end_at: "2019-02-30T12:34:56+00:00",
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(fairData))
        context = {
          fairLoader: mockFairLoader,
        }

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            formattedOpeningHours: "Opens Feb 6 at 12:30pm UTC",
          },
        })
      })
    })

    describe("with running dates", () => {
      it("The fair is closing", async () => {
        const fairData = {
          start_at: "2019-01-20T12:34:56+00:00",
          end_at: "2019-02-04T12:00:56+00:00",
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(fairData))
        context = {
          fairLoader: mockFairLoader,
        }

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            formattedOpeningHours: "Closes Feb 4 at 12:00pm UTC",
          },
        })
      })
    })

    describe("with past dates", () => {
      it("The fair is closed", async () => {
        const fairData = {
          start_at: "2019-01-01T12:34:56+00:00",
          end_at: "2019-01-10T12:34:56+00:00",
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(fairData))
        context = {
          fairLoader: mockFairLoader,
        }

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            formattedOpeningHours: "Closed",
          },
        })
      })
    })
  })

  describe("fair counts", () => {
    let counts

    beforeEach(async () => {
      const query = gql`
        {
          fair(id: "aqua-art-miami-2018") {
            counts {
              artists
              artworks
              partnerShows
              partners
            }
          }
        }
      `

      const data = await runQuery(query, context)
      counts = data.fair.counts
    })

    it("includes the total number of artists", () => {
      expect(counts).toMatchObject({
        artists: 1,
      })
    })

    it("includes the total number of artworks", () => {
      expect(counts).toMatchObject({
        artworks: 2,
      })
    })

    it("includes the total number of partners", () => {
      expect(counts).toMatchObject({
        partners: 3,
      })
    })

    it("includes the total number of partner_shows", () => {
      expect(counts).toMatchObject({
        partnerShows: 4,
      })
    })
  })
})
