jest.mock("lib/sponsoredContent/data.json", () => {
  return {
    fairs: {
      "the-armory-show-2017": {
        activationText: "Lorem ipsum dolor sit amet",
        pressReleaseUrl: "https://www.example.com",
      },
    },
  }
})

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

  const context = {
    fairLoader: sinon.stub().returns(Promise.resolve(fair)),
  }

  it("is_publically_visible returns true when profile is published", () => {
    const profile = {
      id: "the-armory-show",
      published: true,
      private: false,
    }

    context.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, context).then((data) => {
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

  it("returns the href", async () => {
    const hrefQuery = gql`
      {
        fair(id: "the-armory-show-2017") {
          href
        }
      }
    `

    const result = await runQuery(hrefQuery, context)

    expect(result.fair.href).toEqual("/fair/the-armory-show-2017")
  })

  it("is_publically_visible returns false when profile is not published", () => {
    const profile = {
      id: "context",
      published: false,
      private: false,
    }

    context.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, context).then((data) => {
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
          body: [
            {
              name: "A",
            },
            {
              name: "B",
            },
          ],
          headers: {
            "x-total-count": 2,
          },
        })
      ),
      artistsLoader: jest.fn().mockReturnValue(
        Promise.resolve({
          headers: {},
          body: [
            {
              name: "Foo Artist",
              id: "foo-artist",
            },
          ],
        })
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

  it("fair exhibitors with special characters or numbers should be within '#'", async () => {
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

    context.fairPartnersLoader = sinon.stub().returns(
      Promise.resolve({
        body: [
          {
            name: "ArtHelix Gallery",
            id: "arthelix-gallery",
            partner_id: "1234567890",
            partner_show_ids: ["arthelix-gallery"],
          },
          {
            name: "192 Gallery",
            id: "192-gallery",
            partner_id: "192-partner-id",
            partner_show_ids: ["192-gallery"],
          },
          {
            name: "{Suit}",
            id: "suit-gallery",
            partner_id: "suit-partner-id",
            partner_show_ids: ["suit-gallery"],
          },
        ],
        headers: {
          "x-total-count": 3,
        },
      })
    )

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
          {
            letter: "#",
            exhibitors: [
              {
                name: "{Suit}",
                slug: "suit-gallery",
                partnerID: "suit-partner-id",
                profileID: "suit-gallery",
              },
              {
                name: "192 Gallery",
                slug: "192-gallery",
                partnerID: "192-partner-id",
                profileID: "192-gallery",
              },
            ],
          },
        ],
      },
    })
  })

  it("group correctly exhibitors whose names start with accented characters", async () => {
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

    context.fairPartnersLoader = sinon.stub().returns(
      Promise.resolve({
        body: [
          {
            name: "Ánother Gallery",
            id: "another-gallery",
            partner_id: "another-partner-id",
            partner_show_ids: ["another-gallery"],
          },
          {
            name: "Öther name",
            id: "other-name",
            partner_id: "other-partner-id",
            partner_show_ids: ["other-name"],
          },
          {
            name: "ArtHelix Gallery",
            id: "arthelix-gallery",
            partner_id: "1234567890",
            partner_show_ids: ["arthelix-gallery"],
          },
        ],
        headers: {
          "x-total-count": 3,
        },
      })
    )

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
              {
                name: "Ánother Gallery",
                slug: "another-gallery",
                partnerID: "another-partner-id",
                profileID: "another-gallery",
              },
            ],
          },
          {
            letter: "O",
            exhibitors: [
              {
                name: "Öther name",
                slug: "other-name",
                partnerID: "other-partner-id",
                profileID: "other-name",
              },
            ],
          },
        ],
      },
    })
  })

  it("in the '#' group would go special characters first, then numbers", async () => {
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

    context.fairPartnersLoader = sinon.stub().returns(
      Promise.resolve({
        body: [
          {
            name: "192 Gallery",
            id: "192-gallery",
            partner_id: "192-gallery-partner-id",
            partner_show_ids: ["192-gallery"],
          },
          {
            name: "{Suit}",
            id: "suit-gallery",
            partner_id: "suit-gallery-partner-id",
            partner_show_ids: ["suit-gallery"],
          },
          {
            name: "313 Art Project",
            id: "313-art-project",
            partner_id: "313-art-project-partner-id",
            partner_show_ids: ["313-art-project"],
          },
          {
            name: "#hashtag",
            id: "hashtag-gallery",
            partner_id: "hashtag-gallery-partner-id",
            partner_show_ids: ["hashtag-gallery"],
          },
        ],
        headers: {
          "x-total-count": 4,
        },
      })
    )

    const data = await runQuery(query, context)

    expect(data).toEqual({
      fair: {
        slug: "aqua-art-miami-2018",
        name: "Aqua Art Miami 2018",
        exhibitorsGroupedByName: [
          {
            letter: "#",
            exhibitors: [
              {
                name: "#hashtag",
                slug: "hashtag-gallery",
                partnerID: "hashtag-gallery-partner-id",
                profileID: "hashtag-gallery",
              },
              {
                name: "{Suit}",
                slug: "suit-gallery",
                partnerID: "suit-gallery-partner-id",
                profileID: "suit-gallery",
              },
              {
                name: "192 Gallery",
                slug: "192-gallery",
                partnerID: "192-gallery-partner-id",
                profileID: "192-gallery",
              },
              {
                name: "313 Art Project",
                slug: "313-art-project",
                partnerID: "313-art-project-partner-id",
                profileID: "313-art-project",
              },
            ],
          },
        ],
      },
    })
  })

  it("exposes the partner type when grouping exhibitors alphanumerically", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          exhibitorsGroupedByName {
            letter
            exhibitors {
              partner {
                name
              }
            }
          }
        }
      }
    `

    const partner = {
      name: "ArtHelix Gallery",
    }

    context.partnerLoader = sinon.stub().returns(Promise.resolve(partner))

    const data = await runQuery(query, context)

    expect(data).toEqual({
      fair: {
        exhibitorsGroupedByName: [
          {
            letter: "A",
            exhibitors: [
              {
                partner: {
                  name: "ArtHelix Gallery",
                },
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
          shows: showsConnection(first: 1) {
            pageInfo {
              hasNextPage
              endCursor
            }
            pageCursors {
              around {
                page
              }
              first {
                page
              }
              previous {
                page
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    const {
      fair: {
        shows: { pageCursors, pageInfo },
      },
    } = data

    const { around, first, previous } = pageCursors

    expect(around.length).toBe(2)
    expect(first).toBe(null)
    expect(previous).toBe(null)
    expect(pageInfo).toEqual({
      endCursor: "YXJyYXljb25uZWN0aW9uOjA=",
      hasNextPage: true,
    })
    for (let index = 0; index < 2; index++) {
      expect(around[index].page).toBe(index + 1)
    }
  })

  it("paginates by cursor", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          shows: showsConnection(first: 1) {
            pageInfo {
              hasNextPage
            }
            edges {
              node {
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
        shows: {
          pageInfo: {
            hasNextPage: true,
          },
          edges: [
            {
              node: {
                name: "A",
              },
            },
          ],
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
        exhibitionPeriod: "February 15 – 17, 2019",
      },
    })
  })

  it("includes a formatted exhibition period with abbreviated months", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          exhibitionPeriod(format: SHORT)
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
      it("is false", async () => {
        const mockFair = {
          id: "this-fair-was-active",
          active_start_at: moment().subtract(14, "days").toISOString(),
          end_at: moment().subtract(7, "days").toISOString(),
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

    describe("isReverseImageSearchEnabled flag", () => {
      it("should be true when fair artworks are indexed in tineye", async () => {
        const mockFair = {
          id: "fair-with-indexed-tineye-artworks",
          reverse_image_search_enabled: true,
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(mockFair))

        context = {
          fairLoader: mockFairLoader,
        }

        const query = gql`
          {
            fair(id: "fair-with-indexed-tineye-artworks") {
              isReverseImageSearchEnabled
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            isReverseImageSearchEnabled: true,
          },
        })
      })

      it("should be true when more than one fair artworks are indexed in tineye", async () => {
        const mockFair = {
          id: "second-fair-with-indexed-tineye-artworks",
          reverse_image_search_enabled: true,
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(mockFair))

        context = {
          fairLoader: mockFairLoader,
        }

        const query = gql`
          {
            fair(id: "second-fair-with-indexed-tineye-artworks") {
              isReverseImageSearchEnabled
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            isReverseImageSearchEnabled: true,
          },
        })
      })

      it("should be false when fair artworks are NOT indexed in tineye", async () => {
        const mockFair = {
          id: "fair-without-indexed-tineye-artworks",
        }

        const mockFairLoader = jest.fn(() => Promise.resolve(mockFair))

        context = {
          fairLoader: mockFairLoader,
        }

        const query = gql`
          {
            fair(id: "fair-without-indexed-tineye-artworks") {
              isReverseImageSearchEnabled
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          fair: {
            isReverseImageSearchEnabled: false,
          },
        })
      })
    })

    describe("when active_start_at is in the past and end_at is in the future", () => {
      it("is true", async () => {
        const mockFair = {
          id: "this-fair-is-active",
          active_start_at: moment().subtract(7, "days").toISOString(),
          end_at: moment().add(7, "days").toISOString(),
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
      it("is false", async () => {
        const mockFair = {
          id: "this-fair-not-yet-active",
          active_start_at: moment().add(7, "days").toISOString(),
          end_at: moment().add(14, "days").toISOString(),
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
