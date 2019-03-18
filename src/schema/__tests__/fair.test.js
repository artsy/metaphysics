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
import { runQuery } from "test/utils"
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
        id
        name
        organizer {
          profile_id
          profile {
            is_publically_visible
          }
        }
        mobile_image {
          image_url
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
          id: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profile_id: "the-armory-show",
            profile: {
              is_publically_visible: true,
            },
          },
          mobile_image: {
            image_url: "circle-image.jpg",
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
          id: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profile_id: "the-armory-show",
            profile: {
              is_publically_visible: false,
            },
          },
          mobile_image: {
            image_url: "circle-image.jpg",
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
          id: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profile_id: "the-armory-show",
            profile: {
              is_publically_visible: false,
            },
          },
          mobile_image: {
            image_url: "circle-image.jpg",
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
        exhibition_period: "Feb 15 – 17",
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
              id: "1",
              name: "Foo Artist",
            },
          ],
          headers: {
            "x-total-count": 1,
          },
        })
      ),
      artistsLoader: jest.fn().mockReturnValue(
        Promise.resolve([
          {
            name: "Foo Artist",
            id: "1",
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
          id
          name
          exhibitors_grouped_by_name {
            letter
            exhibitors {
              name
              id
              partner_id
              profile_id
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      fair: {
        id: "aqua-art-miami-2018",
        name: "Aqua Art Miami 2018",
        exhibitors_grouped_by_name: [
          {
            letter: "A",
            exhibitors: [
              {
                name: "ArtHelix Gallery",
                id: "arthelix-gallery",
                partner_id: "1234567890",
                profile_id: "arthelix-gallery",
              },
            ],
          },
        ],
      },
    })
  })

  xit("includes a formatted exhibition period", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          exhibition_period
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      fair: {
        exhibition_period: "Feb 15 – 17",
      },
    })
  })

  it("includes artists associated with the fair", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          artists(first: 1) {
            edges {
              node {
                id
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
        artists: {
          edges: [
            {
              node: {
                id: "1",
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
            isActive: false,
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

  describe("fair counts", () => {
    let counts

    beforeEach(async () => {
      const query = gql`
        {
          fair(id: "aqua-art-miami-2018") {
            counts {
              artists
              artworks
              partner_shows
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
        partner_shows: 4,
      })
    })
  })
})
