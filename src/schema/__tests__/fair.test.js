/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import gql from "lib/gql"
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

  const query = `
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

  const rootValue = {
    fairLoader: sinon.stub().returns(Promise.resolve(fair)),
  }

  it("is_publically_visible returns true when profile is published", () => {
    const profile = {
      id: "the-armory-show",
      published: true,
      private: false,
    }

    rootValue.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, rootValue).then(data => {
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

    rootValue.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, rootValue).then(data => {
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

    rootValue.profileLoader = sinon.stub().returns(Promise.resolve(profile))

    return runQuery(query, rootValue).then(data => {
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
})

describe("Fair", () => {
  let rootValue = null
  beforeEach(() => {
    const data = {
      fair: {
        _id: 123,
        id: "aqua-art-miami-2018",
        artists_count: "1",
        name: "Aqua Art Miami 2018",
        exhibitors_grouped_by_name: [
          {
            letter: "A",
            exhibitors: ["ArtHelix Gallery"],
          },
        ],
      },
    }
    rootValue = {
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
            exhibitors
          }
        }
      }
    `

    const data = await runQuery(query, rootValue)

    expect(data).toEqual({
      fair: {
        id: "aqua-art-miami-2018",
        name: "Aqua Art Miami 2018",
        exhibitors_grouped_by_name: [
          {
            letter: "A",
            exhibitors: ["ArtHelix Gallery"],
          },
        ],
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

    const data = await runQuery(query, rootValue)

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

  it("includes returns the total number of artists in the fair", async () => {
    const query = gql`
      {
        fair(id: "aqua-art-miami-2018") {
          artists_count
        }
      }
    `

    const data = await runQuery(query, rootValue)

    expect(data).toEqual({
      fair: {
        artists_count: "1",
      },
    })
  })
})
