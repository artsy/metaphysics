import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { toGlobalId } from "graphql-relay"

describe("User", () => {
  it("implements the NodeInterface", async () => {
    const query = gql`
      {
        user(id: "percy-mongo-id") {
          id
          internalID
          name
        }
      }
    `

    const context = {
      userByIDLoader: (data) => {
        if (data !== "percy-mongo-id")
          throw new Error("Unexpected invocation of loader")

        return Promise.resolve({ id: "percy-mongo-id", name: "Percy Z" })
      },
    }

    const expectedNodeID = toGlobalId("User", "percy-mongo-id")

    const { user } = await runAuthenticatedQuery(query, context)

    expect(user.id).toEqual(expectedNodeID)
    expect(user.internalID).toEqual("percy-mongo-id")
    expect(user.name).toEqual("Percy Z")

    // Now check if can fetch via the `node` field
    const nodeQuery = gql`
      {
        node(id: "${expectedNodeID}") {
          __typename
          ... on User {
            internalID
            name
          }
        }
      }
      `

    const { node } = await runAuthenticatedQuery(nodeQuery, context)

    expect(node.name).toEqual("Percy Z")
    expect(node.internalID).toEqual("percy-mongo-id")
    expect(node.__typename).toEqual("User")
  })

  it("returns expected email fields", async () => {
    const query = `
      {
        user(id: "percy-z") {
          name
          email
          unconfirmedEmail
          emailConfirmedAt
          emailConfirmationSentAt
        }
      }
    `
    const user = {
      name: "Percy Z",
      email: "percy-z@catmail.com",
      unconfirmed_email: "percy-z@purr.me",
      confirmed_at: "2020-01-01T01:00:00.000Z",
      confirmation_sent_at: "2022-01-01T00:00:00.000Z",
    }

    const context = {
      userByIDLoader: () => {
        return Promise.resolve(user)
      },
    }

    const { user: result } = await runAuthenticatedQuery(query, context)

    expect(result.email).toEqual("percy-z@catmail.com")
    expect(result.unconfirmedEmail).toEqual("percy-z@purr.me")
    expect(result.emailConfirmedAt).toEqual("2020-01-01T01:00:00.000Z")
    expect(result.emailConfirmationSentAt).toEqual("2022-01-01T00:00:00.000Z")
  })

  describe("userAlreadyExists", () => {
    it("returns true if a user exists", async () => {
      const foundUser = {
        id: "123456",
        _id: "000012345",
        name: "foo bar",
        pin: "3141",
        paddle_number: "314159",
      }

      const userByEmailLoader = (data) => {
        if (data) {
          return Promise.resolve(foundUser)
        }
        throw new Error("Unexpected invocation")
      }

      const query = gql`
        {
          user(email: "foo@bar.com") {
            pin
            paddleNumber
            userAlreadyExists
          }
        }
      `

      const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
      expect(user.pin).toEqual("3141")
      expect(user.paddleNumber).toEqual("314159")
      expect(user.userAlreadyExists).toEqual(true)
    })

    it("returns false if user is not found by email", async () => {
      const notFoundUser = { error: "User Not Found" }
      const error = new HTTPError(notFoundUser.error, 404)
      const userByEmailLoader = (data) => {
        if (data) {
          return Promise.resolve(notFoundUser)
        }
        throw error
      }
      const query = gql`
        {
          user(email: "nonexistentuser@bar.com") {
            userAlreadyExists
          }
        }
      `
      const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
      expect(user.userAlreadyExists).toEqual(false)
    })
  })

  describe("savedArtworksConnection", () => {
    const query = `
        {
          user(id: "blah") {
            savedArtworksConnection(first: 10) {
              totalCount
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      `

    const user = {
      id: "blah",
    }

    const artworks = [
      {
        title: "Black Cat in Repose",
      },
      {
        title: "Sleeping Cat in Sun",
      },
    ]

    let context

    beforeEach(() => {
      context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        savedArtworksLoader: () => {
          return Promise.resolve({
            body: artworks,
            headers: { "x-total-count": "2" },
          })
        },
      }
    })

    it("returns saved artworks for a user", async () => {
      const {
        user: {
          savedArtworksConnection: { totalCount, edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(totalCount).toEqual(2)
      expect(edges.length).toEqual(2)
      expect(edges[0]).toEqual({
        node: {
          title: "Black Cat in Repose",
        },
      })
      expect(edges[1]).toEqual({
        node: {
          title: "Sleeping Cat in Sun",
        },
      })
    })

    it("returns an empty connection w/ no error if the gravity request 404's", async () => {
      context.savedArtworksLoader = () => {
        return Promise.reject(new HTTPError("Not Found", 404))
      }

      const {
        user: {
          savedArtworksConnection: { totalCount, edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(totalCount).toEqual(0)
      expect(edges).toEqual([])
    })

    it("throws an error if the gravity request errors and it's not a 404", async () => {
      context.savedArtworksLoader = () => {
        return Promise.reject(new HTTPError("Cats in the server room", 500))
      }

      expect.assertions(1)

      try {
        await runAuthenticatedQuery(query, context)
        throw new Error("An error was not thrown but was expected to throw.")
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect, jest/no-try-expect
        expect(error.message).toEqual("Cats in the server room")
      }
    })
  })

  describe("push notification settings", () => {
    it("returns push notification settings for a user", async () => {
      const foundUser = {
        id: "123456",
        _id: "000012345",
        name: "foo bar",
        pin: "3141",
        paddle_number: "314159",
        receive_purchase_notification: false,
        receive_outbid_notification: false,
        receive_lot_opening_soon_notification: false,
        receive_sale_opening_closing_notification: false,
        receive_new_works_notification: true,
        receive_new_sales_notification: false,
        receive_promotion_notification: false,
        receive_order_notification: true,
        receive_viewing_room_notification: true,
      }

      const userByEmailLoader = (data) => {
        if (data) {
          return Promise.resolve(foundUser)
        }
        throw new Error("Unexpected invocation")
      }

      const query = gql`
        {
          user(email: "foo@bar.com") {
            pin
            paddleNumber
            userAlreadyExists
            receivePurchaseNotification
            receiveOutbidNotification
            receiveLotOpeningSoonNotification
            receiveSaleOpeningClosingNotification
            receiveNewWorksNotification
            receiveNewSalesNotification
            receivePromotionNotification
            receiveOrderNotification
            receiveViewingRoomNotification
          }
        }
      `

      const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
      expect(user.pin).toEqual("3141")
      expect(user.paddleNumber).toEqual("314159")
      expect(user.userAlreadyExists).toEqual(true)
      expect(user.receivePurchaseNotification).toEqual(false)
      expect(user.receiveOutbidNotification).toEqual(false)
      expect(user.receiveLotOpeningSoonNotification).toEqual(false)
      expect(user.receiveSaleOpeningClosingNotification).toEqual(false)
      expect(user.receiveNewWorksNotification).toEqual(true)
      expect(user.receiveNewSalesNotification).toEqual(false)
      expect(user.receivePromotionNotification).toEqual(false)
      expect(user.receiveOrderNotification).toEqual(true)
      expect(user.receiveViewingRoomNotification).toEqual(true)
    })
  })

  describe("interestsConnection", () => {
    it("returns user interests", async () => {
      const query = `
        {
          user(id: "blah") {
            interestsConnection(first: 10) {
              totalCount
              pageCursors {
                around {
                  page
                  isCurrent
                }
              }
              edges {
                body
                category
                createdByAdmin
                node {
                  __typename
                  ... on Gene {
                    name
                  }
                  ... on Artist {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const user = {
        id: "blah",
      }

      const interests = [
        {
          body: "Told an admin they collected",
          owner_type: "UserSaleProfile",
          category: "collected_before",
          interest: {
            birthday: 2001,
            name: "Catty Artist",
          },
        },
        {
          body: null,
          owner_type: "CollectorProfile",
          category: "interested_in_collecting",
          interest: {
            name: "Catty Gene",
          },
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userInterestsLoader: () => {
          return Promise.resolve({
            body: interests,
            headers: { "x-total-count": "2" },
          })
        },
      }

      const {
        user: {
          interestsConnection: { edges, totalCount, pageCursors },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(totalCount).toEqual(2)
      expect(pageCursors.around).toEqual([{ page: 1, isCurrent: true }])

      expect(edges.length).toEqual(2)
      expect(edges[0]).toEqual({
        body: "Told an admin they collected",
        category: "COLLECTED_BEFORE",
        createdByAdmin: true,
        node: {
          __typename: "Artist",
          name: "Catty Artist",
        },
      })
      expect(edges[1]).toEqual({
        body: null,
        category: "INTERESTED_IN_COLLECTING",
        createdByAdmin: false,
        node: {
          __typename: "Gene",
          name: "Catty Gene",
        },
      })
    })
  })

  describe("purchasedArtworksConnection", () => {
    it("returns user purchased artworks", async () => {
      const query = `
        {
          user(id: "blah") {
            purchasedArtworksConnection(first: 10) {
              edges {
                ownerType
                salePrice
                source
                node {
                  __typename
                  title
                  slug
                  artistNames
                  partner(shallow: true) {
                    name
                  }
                  saleArtwork {
                    lotLabel
                  }
                }
              }
            }
          }
        }
      `

      const user = {
        id: "blah",
      }

      const purchases = [
        {
          owner_type: "SaleArtwork",
          sale_price: 1000.9999,
          source: "auction",
          artwork: {
            title: "Monkey Business",
            id: "percy-monkey-business",
            artists: [
              {
                name: "Percy Z",
              },
            ],
            partner: {
              name: "123 Auctions",
            },
            sale_ids: ["123"],
          },
        },
        {
          owner_type: "ArtworkInquiryRequest",
          sale_price: 600.1234,
          source: "inquiry",
          artwork: {
            __typename: "Artwork",
            title: "Donkey Business",
            id: "percy-donkey-business",
            artists: [
              {
                name: "Percy Z",
              },
            ],
            partner: {
              name: "123 Auctions",
            },
            sale_ids: ["223"],
          },
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        purchasesLoader: () => {
          return Promise.resolve({
            body: purchases,
            headers: { "x-total-count": "2" },
          })
        },
        saleArtworkLoader: () => {
          return Promise.resolve({
            lot_label: "1",
          })
        },
      }

      const {
        user: {
          purchasedArtworksConnection: { edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(edges.length).toEqual(2)

      expect(edges[0]).toEqual({
        ownerType: "SaleArtwork",
        salePrice: 1000.9999,
        source: "auction",
        node: {
          __typename: "Artwork",
          title: "Monkey Business",
          slug: "percy-monkey-business",
          artistNames: "Percy Z",
          partner: {
            name: "123 Auctions",
          },
          saleArtwork: {
            lotLabel: "1",
          },
        },
      })

      expect(edges[1]).toEqual({
        ownerType: "ArtworkInquiryRequest",
        salePrice: 600.1234,
        source: "inquiry",
        node: {
          __typename: "Artwork",
          title: "Donkey Business",
          slug: "percy-donkey-business",
          artistNames: "Percy Z",
          partner: {
            name: "123 Auctions",
          },
          saleArtwork: {
            lotLabel: "1",
          },
        },
      })
    })
  })

  describe("accessiblePropertiesConnection", () => {
    it("returns properties a user has access to", async () => {
      const query = `
        {
          user(id: "blah") {
            accessiblePropertiesConnection(first: 10) {
              edges {
                node {
                  ... on Artwork {
                    title
                  }
                  ... on Partner {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const user = {
        id: "blah",
      }

      const accessControls = [
        {
          property_type: "Artwork",
          property: {
            title: "Catty Artwork",
          },
        },
        {
          property_type: "Partner",
          property: {
            name: "Catty Partner",
          },
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userAccessControlLoaderAllProperties: () => {
          return Promise.resolve({
            body: accessControls,
            headers: { "x-total-count": "2" },
          })
        },
      }

      const {
        user: {
          accessiblePropertiesConnection: { edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(edges.length).toEqual(2)

      expect(edges[0]).toEqual({
        node: {
          title: "Catty Artwork",
        },
      })

      expect(edges[1]).toEqual({
        node: {
          name: "Catty Partner",
        },
      })
    })
  })

  describe("follows", () => {
    it("returns user follows", async () => {
      const query = `
        {
          user(id: "abc") {
            follows {
              artistsConnection(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
              genesConnection(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const user = {
        id: "abc",
      }

      const artistFollows = [
        {
          name: "Frank Stella",
        },
        {
          name: "Ed Ruscha",
        },
      ]

      const geneFollows = [
        {
          name: "Emerging Art",
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userArtistFollowsLoader: () => {
          return Promise.resolve({
            body: artistFollows,
            headers: { "x-total-count": "2" },
          })
        },
        userGeneFollowsLoader: () => {
          return Promise.resolve({
            body: geneFollows,
            headers: { "x-total-count": "1" },
          })
        },
      }

      const {
        user: {
          follows: { artistsConnection, genesConnection },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(artistsConnection.edges.length).toEqual(2)
      expect(genesConnection.edges.length).toEqual(1)

      expect(artistsConnection.edges[0]).toEqual({
        node: {
          name: "Frank Stella",
        },
      })

      expect(artistsConnection.edges[1]).toEqual({
        node: {
          name: "Ed Ruscha",
        },
      })

      expect(genesConnection.edges[0]).toEqual({
        node: {
          name: "Emerging Art",
        },
      })
    })
  })

  describe("collectorProfile", () => {
    it("returns the user's collector profile", async () => {
      const query = `
        {
          user(id: "blah") {
            collectorProfile {
              companyName
              companyWebsite
            }
          }
        }
      `

      const user = {
        id: "blah",
      }

      const collectorProfiles = [
        {
          company_name: "Nun'ya Business",
          company_website: "donotcontact.me",
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        collectorProfilesLoader: (data) => {
          if (data.user_id !== "blah") {
            throw new Error(
              "Unexpected user ID passed to collector profile loader"
            )
          }
          return Promise.resolve({
            body: collectorProfiles,
            headers: { "x-total-count": "1" },
          })
        },
      }

      const {
        user: { collectorProfile },
      } = await runAuthenticatedQuery(query, context)

      expect(collectorProfile.companyName).toEqual("Nun'ya Business")
      expect(collectorProfile.companyWebsite).toEqual("donotcontact.me")
    })
  })

  describe("saleProfile", () => {
    it("returns the user's sale profile", async () => {
      const query = `
        {
          user(id: "blah") {
            saleProfile {
              requireBidderApproval
              employer
              jobTitle
            }
          }
        }
      `

      const user = {
        id: "blah",
      }

      const userSaleProfile = {
        require_bidder_approval: true,
        employer: "Cats R Us",
        job_title: "CCO - Chief Cat Officer",
      }

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userSaleProfileLoader: () => {
          return Promise.resolve(userSaleProfile)
        },
      }

      const {
        user: { saleProfile },
      } = await runAuthenticatedQuery(query, context)
      expect(saleProfile.requireBidderApproval).toEqual(true)
      expect(saleProfile.employer).toEqual("Cats R Us")
      expect(saleProfile.jobTitle).toEqual("CCO - Chief Cat Officer")
    })
  })

  describe("inquiredArtworksConnection", () => {
    const query = `
        {
          user(id: "blah") {
            inquiredArtworksConnection(first: 10) {
              edges {
                status
                outcome
                note
                createdAt(format: "YYYY-MM-DD")
                isSentToGallery
                node {
                  title
                }
              }
            }
          }
        }
      `

    const user = {
      id: "blah",
    }

    const inquiries = [
      {
        contact_gallery: true,
        created_at: "2022-08-13T21:44:09+00:00",
        inquireable: {
          title: "Cat Painting",
        },
        note: "I love cats",
        outcome: "Bought painting",
        statuses: [
          {
            title: "Awaiting 1st gallery response",
            created_at: "2022-08-13T21:44:09+00:00",
          },
          {
            title: "Gallery accepted",
            created_at: "2022-08-14T21:44:09+00:00",
          },
        ],
      },
    ]

    let context

    beforeEach(() => {
      context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userInquiryRequestsLoader: () => {
          return Promise.resolve({
            body: inquiries,
            headers: { "x-total-count": "1" },
          })
        },
      }
    })

    it("returns inquired-upon artworks for a user", async () => {
      const {
        user: {
          inquiredArtworksConnection: { edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(edges.length).toEqual(1)
      expect(edges[0]).toEqual({
        status: "Gallery accepted",
        outcome: "Bought painting",
        note: "I love cats",
        createdAt: "2022-08-13",
        isSentToGallery: true,
        node: {
          title: "Cat Painting",
        },
      })
    })
  })
  describe("adminNotes", () => {
    it("returns the admin notes associated with a user in descending order", async () => {
      const query = `
        {
          user(id: "abc123") {
            adminNotes {
              body
              createdAt
            }
          }
        }
      `

      const user = {
        id: "abc123",
      }

      const userAdminNotes = [
        {
          body: "A Good collector",
          created_at: "2022-04-24T09:00:00+00:00",
        },
        {
          body: "Now a great collector",
          created_at: "2022-06-15T10:00:00+00:00",
        },
        {
          body: "The best collector",
          created_at: "2022-09-30T12:00:00+00:00",
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userAdminNotesLoader: () => {
          return Promise.resolve(userAdminNotes)
        },
      }

      const {
        user: { adminNotes },
      } = await runAuthenticatedQuery(query, context)

      expect(adminNotes[0].body).toEqual("The best collector")
      expect(adminNotes[1].body).toEqual("Now a great collector")
      expect(adminNotes[2].body).toEqual("A Good collector")
    })
  })
})
