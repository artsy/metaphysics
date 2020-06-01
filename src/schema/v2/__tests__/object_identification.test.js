/* eslint-disable promise/always-return */
import _ from "lodash"
import { toGlobalId } from "graphql-relay"
import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Object Identification", () => {
  // TODO As we add more loaders, remove the old tests at the bottom of this file and add them here.
  const loaderTests = {
    Article: {
      articleLoader: {
        id: "foo-bar",
        slug: "foo-bar",
        title: "Nightlife at the Foo Bar",
        author: "Artsy Editorial",
      },
    },
    Artist: {
      artistLoader: {
        id: "foo-bar",
        _id: "234rewr",
        birthday: null,
        artworks_count: 42,
      },
    },
    Artwork: {
      artworkLoader: {
        id: "foo-bar",
        _id: "sf34werwe",
        title: "Foo Bar",
        artists: null,
      },
    },
    Partner: {
      partnerLoader: {
        id: "foo-bar",
        _id: "234rwe233",
        has_full_profile: true,
        profile_banner_display: false,
      },
    },
    Show: {
      showLoader: {
        id: "foo-bar",
        _id: "234werr3ef",
        displayable: true, // this is only so that the show doesn’t get rejected
        partner: {
          id: "for-baz",
        },
        display_on_partner_profile: true,
      },
    },
    Fair: {
      fairLoader: {
        id: "foo-bar",
      },
    },
  }

  _.keys(loaderTests).forEach((typeName) => {
    const fieldName = _.snakeCase(typeName)
    const loaderName = _.keys(loaderTests[typeName])[0]
    const payload = loaderTests[typeName][loaderName]
    const context = {
      [loaderName]: sinon
        .stub()
        .withArgs(payload.id)
        .returns(Promise.resolve(payload)),
    }

    describe(`for a ${typeName}`, () => {
      xit("generates a Global ID", () => {
        const query = `
          {
            ${fieldName}(id: "foo-bar") {
              id 
            }
          }
        `

        return runQuery(query, context).then((data) => {
          const expectedData = {}
          expectedData[fieldName] = {
            id: toGlobalId(typeName, "foo-bar"),
          }
          expect(data).toEqual(expectedData)
        })
      })

      it("resolves a node", () => {
        const query = `
          {
            node(id: "${toGlobalId(typeName, "foo-bar")}") {
              __typename
              ... on ${typeName} {
                slug 
              }
            }
          }
        `

        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            node: {
              __typename: typeName,
              slug: "foo-bar",
            },
          })
        })
      })
    })
  })
  describe("for the Me field", () => {
    const globalId = toGlobalId("Me", "user-42")
    it("generates a Global ID", () => {
      const query = `
        {
          me {
            id
          }
        }
      `
      return runAuthenticatedQuery(query).then((data) => {
        expect(data).toEqual({
          me: {
            id: globalId,
          },
        })
      })
    })
    it("resolves a node", () => {
      const query = `
        {
          node(id: "${globalId}") {
            __typename
            ... on Me {
              internalID
            }
          }
        }
      `
      return runAuthenticatedQuery(query).then((data) => {
        expect(data).toEqual({
          node: {
            __typename: "Me",
            internalID: "user-42",
          },
        })
      })
    })
  })
  describe("for a HomePageArtworkModule", () => {
    describe("with a specific module", () => {
      const globalId = toGlobalId(
        "HomePageArtworkModule",
        JSON.stringify({ key: "popular_artists" })
      )
      it("generates a Global ID", () => {
        const query = `
          {
            homePage {
              artworkModule(key: "popular_artists") {
                id
              }
            }
          }
        `
        return runQuery(query).then((data) => {
          expect(data).toEqual({
            homePage: {
              artworkModule: {
                id: globalId,
              },
            },
          })
        })
      })
      it("resolves a node", () => {
        const query = `
          {
            node(id: "${globalId}") {
              __typename
              ... on HomePageArtworkModule {
                key
              }
            }
          }
        `
        return runQuery(query).then((data) => {
          expect(data).toEqual({
            node: {
              __typename: "HomePageArtworkModule",
              key: "popular_artists",
            },
          })
        })
      })
    })
    describe("with a generic gene", () => {
      const globalId = toGlobalId(
        "HomePageArtworkModule",
        JSON.stringify({ id: "abstract-art", key: "generic_gene" })
      )
      it("generates a Global ID", () => {
        const query = `
          {
            homePage {
              artworkModule(key: "generic_gene", id: "abstract-art") {
                id
              }
            }
          }
        `
        return runQuery(query).then((data) => {
          expect(data).toEqual({
            homePage: {
              artworkModule: {
                id: globalId,
              },
            },
          })
        })
      })
      it("resolves a node", () => {
        const query = `
          {
            node(id: "${globalId}") {
              __typename
              ... on HomePageArtworkModule {
                key
                params {
                  internalID
                }
              }
            }
          }
        `
        return runQuery(query).then((data) => {
          expect(data).toEqual({
            node: {
              __typename: "HomePageArtworkModule",
              key: "generic_gene",
              params: {
                internalID: "abstract-art",
              },
            },
          })
        })
      })
    })
    describe("with a related artist", () => {
      const globalId = toGlobalId(
        "HomePageArtworkModule",
        JSON.stringify({
          followedArtistID: "pablo-picasso",
          relatedArtistID: "charles-broskoski",
          key: "related_artists",
        })
      )
      // FIXME: Generated ID is incorrect?
      it.skip("generates a Global ID", () => {
        const query = `
          {
            homePage {
              artworkModule(key: "related_artists",
                             relatedArtistID: "charles-broskoski",
                             followedArtistID: "pablo-picasso") {
                id
              }
            }
          }
        `
        return runQuery(query).then((data) => {
          expect(data).toEqual({
            homePage: {
              artworkModule: {
                id: globalId,
              },
            },
          })
        })
      })
      it("resolves a node", () => {
        const query = `
          {
            node(id: "${globalId}") {
              __typename
              ... on HomePageArtworkModule {
                key
                params {
                  relatedArtistID
                  followedArtistID
                }
              }
            }
          }
        `
        return runQuery(query).then((data) => {
          expect(data).toEqual({
            node: {
              __typename: "HomePageArtworkModule",
              key: "related_artists",
              params: {
                relatedArtistID: "charles-broskoski",
                followedArtistID: "pablo-picasso",
              },
            },
          })
        })
      })
    })
  })
  describe("for a HomePageArtistModule", () => {
    const globalId = toGlobalId(
      "HomePageArtistModule",
      JSON.stringify({ key: "TRENDING" })
    )
    it("generates a Global ID", () => {
      const query = `
        {
          homePage {
            artistModule(key: TRENDING) {
              id
            }
          }
        }
      `
      return runQuery(query).then((data) => {
        expect(data).toEqual({
          homePage: {
            artistModule: {
              id: globalId,
            },
          },
        })
      })
    })
    it("resolves a node", () => {
      const query = `
        {
          node(id: "${globalId}") {
            __typename
            ... on HomePageArtistModule {
              key
            }
          }
        }
      `
      return runQuery(query).then((data) => {
        expect(data).toEqual({
          node: {
            __typename: "HomePageArtistModule",
            key: "TRENDING",
          },
        })
      })
    })
  })
  /*
   * These test that the proper AST is passed on by testing that the `Me` type
   * doesn’t make any gravity calls (as the `Me` type’s `resolve` function is
   * optimised to not make a request when
   * only the `id` field is requested).
   */
  describe("concerning passing the proper AST to resolvers", () => {
    const globalId = toGlobalId("Me", "user-42")
    it("should pass the proper inline fragment AST", () => {
      const query = `
        {
          node(id: "${globalId}") {
            ... on Me {
              internalID
            }
          }
        }
      `
      return runAuthenticatedQuery(query).then((data) => {
        expect(data).toEqual({
          node: {
            internalID: "user-42",
          },
        })
      })
    })
    it("should pass the proper spread fragment AST", () => {
      const query = `
        {
          node(id: "${globalId}") {
            ... fields
          }
        }
        fragment fields on Me {
          internalID
        }
      `
      return runAuthenticatedQuery(query).then((data) => {
        expect(data).toEqual({
          node: {
            internalID: "user-42",
          },
        })
      })
    })
  })
})
