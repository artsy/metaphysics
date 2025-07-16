/* eslint-disable promise/always-return */
import gql from "lib/gql"
import moment from "moment"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("me/index", () => {
  const query = gql`
    query {
      me {
        name
        email
        phone
        paddleNumber
        isIdentityVerified
        hasSecondFactorEnabled
        hasPassword
        hasPriceRange
        labFeatures
        receivePurchaseNotification
        receiveOutbidNotification
        receiveLotOpeningSoonNotification
        receiveSaleOpeningClosingNotification
        receiveNewWorksNotification
        receiveNewSalesNotification
        receivePromotionNotification
        receiveOrderNotification
        receiveViewingRoomNotification
        receivePartnerShowNotification
        receivePartnerOfferNotification
        currencyPreference
        lengthUnitPreference
      }
    }
  `

  it("loads a user's pending identity verification", () => {
    const meLoader = () =>
      Promise.resolve({ pending_identity_verification_id: "idv-id" })
    const identityVerificationLoader = (id) =>
      Promise.resolve({
        id: id,
      })

    const query = gql`
      query {
        me {
          pendingIdentityVerification {
            internalID
          }
        }
      }
    `
    return runAuthenticatedQuery(query, {
      meLoader,
      identityVerificationLoader,
    }).then((data) => {
      expect(data).toEqual({
        me: {
          pendingIdentityVerification: {
            internalID: "idv-id",
          },
        },
      })
    })
  })

  it("loads data from meLoader", () => {
    const body = {
      name: "Test User",
      email: "test@email.com",
      phone: "07892938949",
      paddle_number: "123456",
      identity_verified: true,
      second_factor_enabled: true,
      has_password: false,
      has_price_range: true,
      lab_features: ["CMS Batch Edit", "Collector Resume"],
      receive_purchase_notification: false,
      receive_outbid_notification: true,
      receive_lot_opening_soon_notification: false,
      receive_sale_opening_closing_notification: false,
      receive_new_works_notification: false,
      receive_new_sales_notification: true,
      receive_promotion_notification: false,
      receive_order_notification: false,
      receive_viewing_room_notification: true,
      receive_partner_show_notification: true,
      receive_partner_offer_notification: true,
      currency_preference: "USD",
      length_unit_preference: "in",
    }

    return runAuthenticatedQuery(query, {
      meLoader: () => Promise.resolve(body),
    }).then((data) => {
      expect(data).toEqual({
        me: {
          name: "Test User",
          email: "test@email.com",
          phone: "07892938949",
          paddleNumber: "123456",
          isIdentityVerified: true,
          hasSecondFactorEnabled: true,
          hasPassword: false,
          hasPriceRange: true,
          labFeatures: ["CMS Batch Edit", "Collector Resume"],
          receivePurchaseNotification: false,
          receiveOutbidNotification: true,
          receiveLotOpeningSoonNotification: false,
          receiveSaleOpeningClosingNotification: false,
          receiveNewWorksNotification: false,
          receiveNewSalesNotification: true,
          receivePromotionNotification: false,
          receiveOrderNotification: false,
          receiveViewingRoomNotification: true,
          receivePartnerShowNotification: true,
          receivePartnerOfferNotification: true,
          currencyPreference: "USD",
          lengthUnitPreference: "IN",
        },
      })
    })
  })

  describe("hasQualifiedCreditCards", () => {
    const creditCardQuery = gql`
      query {
        me {
          hasQualifiedCreditCards
        }
      }
    `
    it("returns true if at least one non-expired card is returned from the me/credit_cards endpoint", () => {
      const futureExpirationDate = moment.utc().add(1, "day")
      const creditCardsResponse = [
        {
          id: "aabbccddee",
          brand: "Visa",
          name: "Test User",
          last_digits: "4242",
          created_at: "2018-04-25T14:53:44.000Z",
          // Moment months are 0-indexed
          expiration_month: futureExpirationDate.month() + 1,
          expiration_year: futureExpirationDate.year(),
          deactivated_at: null,
          created_by_admin: null,
          created_by_trusted_client: null,
          qualified_for_bidding: true,
          provider: "Stripe",
          address_zip_check: "pass",
          address_line1_check: "pass",
          cvc_check: "pass",
        },
      ]

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "1" },
          }),
      }).then((data) => {
        expect(data).toEqual({ me: { hasQualifiedCreditCards: true } })
      })
    })

    it("returns false if the me/credit_cards endpoint returns only expired cards", () => {
      const futureExpirationDate = moment.utc().subtract(1, "month")
      const creditCardsResponse = [
        {
          id: "aabbccddee",
          brand: "Visa",
          name: "Test User",
          last_digits: "4242",
          created_at: "2018-04-25T14:53:44.000Z",
          // Moment months are 0-indexed
          expiration_month: futureExpirationDate.month() + 1,
          expiration_year: futureExpirationDate.year(),
          deactivated_at: null,
          created_by_admin: null,
          created_by_trusted_client: null,
          qualified_for_bidding: true,
          provider: "Stripe",
          address_zip_check: "pass",
          address_line1_check: "pass",
          cvc_check: "pass",
        },
      ]

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "1" },
          }),
      }).then((data) => {
        expect(data).toEqual({ me: { hasQualifiedCreditCards: false } })
      })
    })

    it("returns false for has_qualified_credit_cards if none are returned from the me/credit_cards endpoint", () => {
      const creditCardsResponse = []

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "0" },
          }),
      }).then((data) => {
        expect(data).toEqual({
          me: {
            hasQualifiedCreditCards: false,
          },
        })
      })
    })
  })

  describe("hasCreditCards", () => {
    const creditCardQuery = gql`
      query {
        me {
          hasCreditCards
        }
      }
    `
    it("returns true for has_credit_cards if one is returned from the me/credit_cards endpoint", () => {
      const creditCardsResponse = [
        {
          id: "aabbccddee",
          brand: "Visa",
          name: "Test User",
          last_digits: "4242",
          created_at: "2018-04-25T14:53:44.000Z",
          expiration_month: 3,
          expiration_year: 2022,
          deactivated_at: null,
          created_by_admin: null,
          created_by_trusted_client: null,
          qualified_for_bidding: false,
          provider: "Stripe",
          address_zip_check: "pass",
          address_line1_check: "pass",
          cvc_check: "pass",
        },
      ]

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "0" },
          }),
      }).then((data) => {
        expect(data).toEqual({ me: { hasCreditCards: true } })
      })
    })

    it("returns false for has_qualified_credit_cards if none are returned from the me/credit_cards endpoint", () => {
      const creditCardsResponse = []

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "0" },
          }),
      }).then((data) => {
        expect(data).toEqual({ me: { hasCreditCards: false } })
      })
    })
  })

  describe("unreadNotificationsCount", () => {
    const countQuery = gql`
      query {
        me {
          unreadNotificationsCount
        }
      }
    `

    it("returns the number of unread notifications", () => {
      return runAuthenticatedQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unread: 12 }),
      }).then((data) => {
        expect(data).toEqual({ me: { unreadNotificationsCount: 12 } })
      })
    })

    it("handles an unauthorized request", () => {
      return runQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unread: null }),
      }).catch((error) => {
        expect(error.message).toEqual(
          "You need to be signed in to perform this action"
        )
      })
    })

    it("handles a null from gravity", () => {
      return runAuthenticatedQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unread: null }),
      }).then((data) => {
        expect(data).toEqual({ me: { unreadNotificationsCount: 0 } })
      })
    })
  })

  describe("unseenNotificationsCount", () => {
    const countQuery = gql`
      query {
        me {
          unseenNotificationsCount
        }
      }
    `

    it("returns the number of unseen notifications", () => {
      return runAuthenticatedQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unseen: 12 }),
      }).then((data) => {
        expect(data).toEqual({ me: { unseenNotificationsCount: 12 } })
      })
    })

    it("handles an unauthorized request", () => {
      return runQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unseen: null }),
      }).catch((error) => {
        expect(error.message).toEqual(
          "You need to be signed in to perform this action"
        )
      })
    })

    it("handles a null from gravity", () => {
      return runAuthenticatedQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unseen: null }),
      }).then((data) => {
        expect(data).toEqual({ me: { unseenNotificationsCount: 0 } })
      })
    })
  })

  describe("canRequestEmailConfirmation", () => {
    it("returns whatever boolean is returned at `can_request_email_confirmation` in the Gravity response", async () => {
      const minimalMeLoaderResponse = {
        can_request_email_confirmation: false,
      }
      const query = gql`
        query {
          me {
            canRequestEmailConfirmation
          }
        }
      `

      const response = await runAuthenticatedQuery(query, {
        meLoader: () => Promise.resolve(minimalMeLoaderResponse),
      })

      expect(response).toEqual({ me: { canRequestEmailConfirmation: false } })
    })
  })

  describe("isEmailConfirmed", () => {
    const emailConfirmedQuery = gql`
      query {
        me {
          isEmailConfirmed
        }
      }
    `

    it("returns email confirmed when the email is confirmed in gravity", () => {
      return runAuthenticatedQuery(emailConfirmedQuery, {
        meLoader: () =>
          Promise.resolve({ confirmed_at: "2020-10-01T20:21:45+00:00" }),
      }).then((data) => {
        expect(data).toEqual({ me: { isEmailConfirmed: true } })
      })
    })

    it("returns email is not confirmed when the email is not confirmed in gravity", () => {
      return runQuery(emailConfirmedQuery, {
        meLoader: () => Promise.resolve({ isEmailConfirmed: false }),
      }).then((data) => {
        expect(data).toEqual({ me: { isEmailConfirmed: false } })
      })
    })
  })

  describe("alertsConnection", () => {
    const query = gql`
      query {
        me {
          alertsConnection(first: 1, sort: ENABLED_AT_DESC) {
            totalCount
            edges {
              node {
                internalID
                searchCriteriaID
                keyword
                artistIDs
                settings {
                  email
                  name
                  frequency
                }
              }
            }
          }
        }
      }
    `

    it("returns the alerts connection", async () => {
      const meLoader = () => Promise.resolve({})
      const meAlertsLoader = () =>
        Promise.resolve({
          body: [
            {
              id: "123",
              search_criteria: {
                keyword: "cats",
                artist_ids: ["andy-warhol"],
                id: "search-criteria-id",
              },
              frequency: "daily",
              name: "My Alert",
              email: true,
            },
          ],
          headers: { "x-total-count": "1" },
        })

      const data = await runAuthenticatedQuery(query, {
        meLoader,
        meAlertsLoader,
      })

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "alertsConnection": {
              "edges": [
                {
                  "node": {
                    "artistIDs": [
                      "andy-warhol",
                    ],
                    "internalID": "123",
                    "keyword": "cats",
                    "searchCriteriaID": "search-criteria-id",
                    "settings": {
                      "email": true,
                      "frequency": "DAILY",
                      "name": "My Alert",
                    },
                  },
                },
              ],
              "totalCount": 1,
            },
          },
        }
      `)
    })

    it("calls gravity with the correct params", async () => {
      const query = gql`
        query {
          me {
            alertsConnection(
              first: 1
              sort: ENABLED_AT_DESC
              attributes: {
                acquireable: true
                additionalGeneIDs: ["gene1", "gene2"]
                artistIDs: ["kaws", "banksy"]
                artistSeriesIDs: ["series1", "series2"]
                atAuction: true
                attributionClass: ["unique", "limited edition"]
                colors: ["blue", "red"]
                height: "10"
                inquireableOnly: true
                locationCities: ["New York", "Los Angeles"]
                majorPeriods: ["period1", "period2"]
                materialsTerms: ["oil", "canvas"]
                offerable: true
                partnerIDs: ["partner1", "partner2"]
                priceRange: "*-1000"
                sizes: [SMALL, MEDIUM]
                width: "10"
              }
            ) {
              totalCount
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const meLoader = () => Promise.resolve({})
      const meAlertsLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          body: [],
          headers: { "x-total-count": "0" },
        })
      )

      await runAuthenticatedQuery(query, {
        meLoader,
        meAlertsLoader,
      })

      expect(meAlertsLoader).toHaveBeenCalledWith({
        page: 1,
        search_criteria: {
          acquireable: true,
          additional_gene_ids: ["gene1", "gene2"],
          artist_ids: ["kaws", "banksy"],
          artist_series_ids: ["series1", "series2"],
          at_auction: true,
          attribution_class: ["unique", "limited edition"],
          colors: ["blue", "red"],
          height: "10",
          inquireable_only: true,
          location_cities: ["New York", "Los Angeles"],
          major_periods: ["period1", "period2"],
          materials_terms: ["oil", "canvas"],
          offerable: true,
          partner_ids: ["partner1", "partner2"],
          price_range: "*-1000",
          sizes: ["small", "medium"],
          width: "10",
        },
        size: 1,
        sort: "-enabled_at",
        total_count: true,
      })
    })
  })

  describe("alert", () => {
    const query = gql`
      query {
        me {
          alert(id: "123") {
            internalID
            searchCriteriaID
            keyword
            artistIDs
            displayName
            title: displayName(only: [artistIDs])
            subtitle: displayName(except: [artistIDs])
            settings {
              email
              frequency
            }
            artworksConnection(first: 1) {
              counts {
                total
              }
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      }
    `

    it("returns the alert", async () => {
      const meLoader = () => Promise.resolve({})
      const meAlertLoader = () =>
        Promise.resolve({
          id: "123",
          search_criteria: {
            keyword: "cats",
            artist_ids: ["andy-warhol"],
            price_range: "*-1000",
            additional_gene_ids: ["painting"],
            id: "search-criteria-id",
            for_sale: true,
          },
          frequency: "daily",
          email: true,
        })

      const filterArtworksLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          hits: [
            {
              title: "Soup can",
            },
          ],
          aggregations: {
            total: {
              value: 1,
            },
          },
        })
      )

      const context = {
        meLoader,
        meAlertLoader,
        artistLoader: () => Promise.resolve({ name: "Andy Warhol" }),
        authenticatedLoaders: {
          filterArtworksLoader,
        },
        unauthenticatedLoaders: {
          filterArtworksLoader,
        },
      }

      const data = await runQuery(query, context)

      expect(
        context.unauthenticatedLoaders.filterArtworksLoader
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          artist_ids: ["andy-warhol"],
          price_range: "*-1000",
          aggregations: ["total"],
          for_sale: true,
        })
      )

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "alert": {
              "artistIDs": [
                "andy-warhol",
              ],
              "artworksConnection": {
                "counts": {
                  "total": 1,
                },
                "edges": [
                  {
                    "node": {
                      "title": "Soup can",
                    },
                  },
                ],
              },
              "displayName": "Andy Warhol — $0–$1,000, Painting",
              "internalID": "123",
              "keyword": "cats",
              "searchCriteriaID": "search-criteria-id",
              "settings": {
                "email": true,
                "frequency": "DAILY",
              },
              "subtitle": "$0–$1,000, Painting",
              "title": "Andy Warhol",
            },
          },
        }
      `)
    })
  })

  describe("counts", () => {
    describe("savedSearches", () => {
      it("returns the number of saved searches", async () => {
        const query = gql`
          query {
            me {
              counts {
                savedSearches
              }
            }
          }
        `

        const meLoader = () => Promise.resolve({})
        const meAlertsLoader = () =>
          Promise.resolve({
            body: [],
            headers: { "x-total-count": "12" },
          })

        const data = await runAuthenticatedQuery(query, {
          meLoader,
          meAlertsLoader,
        })

        expect(data).toEqual({
          me: {
            counts: {
              savedSearches: 12,
            },
          },
        })
      })
    })
  })

  describe("partnerOffersConnection", () => {
    it("returns partner offers for the collector", async () => {
      const meLoader = () => Promise.resolve({})
      const mePartnerOffersLoader = jest.fn(() =>
        Promise.resolve({
          body: [
            {
              id: "866f16a0-92bf-4fb6-8911-e1ab1a5fb508",
              active: true,
              artwork_id: "65d9b98ae37dd70006240bf6",
              available: true,
              note: "This is a note!",
              partner_id: "5f80bfefe8d808000ea212c1",
              price_currency: "USD",
              price_listed: 56000.0,
              price_listed_minor: 5600000,
              price_with_discount: 17360.0,
              price_with_discount_minor: 1736000,
              discount_percentage: 69,
              created_at: "2024-02-27T19:01:51.461Z",
              end_at: "2024-03-01T19:01:51.457Z",
            },
          ],
          headers: { "x-total-count": "1" },
        })
      )
      const query = gql`
        query {
          me {
            partnerOffersConnection(first: 10) {
              totalCount
              edges {
                node {
                  internalID
                  artworkId
                  isActive
                  isAvailable
                  note
                  partnerId
                  priceWithDiscount {
                    display
                    major
                    minor
                    currencyCode
                  }
                  createdAt
                  endAt
                }
              }
            }
          }
        }
      `
      const response = await runAuthenticatedQuery(query, {
        meLoader,
        mePartnerOffersLoader,
      })

      expect(mePartnerOffersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        total_count: true,
      })

      expect(response).toEqual({
        me: {
          partnerOffersConnection: {
            totalCount: 1,
            edges: [
              {
                node: {
                  artworkId: "65d9b98ae37dd70006240bf6",
                  createdAt: "2024-02-27T19:01:51.461Z",
                  endAt: "2024-03-01T19:01:51.457Z",
                  internalID: "866f16a0-92bf-4fb6-8911-e1ab1a5fb508",
                  isActive: true,
                  isAvailable: true,
                  note: "This is a note!",
                  partnerId: "5f80bfefe8d808000ea212c1",
                  priceWithDiscount: {
                    currencyCode: "USD",
                    display: "US$17,360",
                    minor: 1736000,
                    major: 17360,
                  },
                },
              },
            ],
          },
        },
      })
    })

    it("returns partner offers for the collector on an artwork", async () => {
      const meLoader = () => Promise.resolve({})
      const mePartnerOffersLoader = jest.fn(() =>
        Promise.resolve({
          body: [
            {
              id: "866f16a0-92bf-4fb6-8911-e1ab1a5fb508",
              active: true,
              artwork_id: "65d9b98ae37dd70006240bf6",
              available: true,
              partner_id: "5f80bfefe8d808000ea212c1",
              price_currency: "GBP",
              price_listed: 56000.0,
              price_listed_minor: 5600000,
              price_with_discount: 17360.0,
              price_with_discount_minor: 1736000,
              discount_percentage: 69,
              note: "This is  a note!",
              source: "Save",
              created_at: "2024-02-27T19:01:51.461Z",
              end_at: "2024-03-01T19:01:51.457Z",
            },
          ],
          headers: { "x-total-count": "1" },
        })
      )
      const query = gql`
        query {
          me {
            partnerOffersConnection(artworkID: "art.jpg", first: 10) {
              totalCount
              edges {
                node {
                  internalID
                  artworkId
                  note
                  source
                  priceWithDiscount {
                    display
                    major
                    minor
                    currencyCode
                  }
                }
              }
            }
          }
        }
      `
      const response = await runAuthenticatedQuery(query, {
        meLoader,
        mePartnerOffersLoader,
      })

      expect(mePartnerOffersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        total_count: true,
        artwork_id: "art.jpg",
      })

      expect(response).toEqual({
        me: {
          partnerOffersConnection: {
            totalCount: 1,
            edges: [
              {
                node: {
                  artworkId: "65d9b98ae37dd70006240bf6",
                  internalID: "866f16a0-92bf-4fb6-8911-e1ab1a5fb508",
                  note: "This is  a note!",
                  source: "SAVE",
                  priceWithDiscount: {
                    currencyCode: "GBP",
                    display: "£17,360",
                    minor: 1736000,
                    major: 17360,
                  },
                },
              },
            ],
          },
        },
      })
    })
  })
})

describe("recommendedArtworks", () => {
  const query = gql`
    query {
      me {
        recommendedArtworks(first: 1) {
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

  it("returns recommended artworks for the user", async () => {
    const meLoader = () => Promise.resolve({})
    const homepageSuggestedArtworksLoader = jest.fn(() =>
      Promise.resolve([
        {
          id: "1",
          title: "Soup can 1",
        },
      ])
    )
    const response = await runAuthenticatedQuery(query, {
      meLoader,
      homepageSuggestedArtworksLoader,
    })

    expect(homepageSuggestedArtworksLoader).toHaveBeenCalledWith({
      limit: 1,
    })

    expect(response).toEqual({
      me: {
        recommendedArtworks: {
          totalCount: 1,
          edges: [
            {
              node: {
                title: "Soup can 1",
              },
            },
          ],
        },
      },
    })
  })

  it("fails gracefully if the loader throws an error", async () => {
    const meLoader = () => Promise.resolve({})
    const homepageSuggestedArtworksLoader = jest.fn(() =>
      Promise.reject(new Error("An error occurred"))
    )

    await expect(
      runAuthenticatedQuery(query, {
        meLoader,
        homepageSuggestedArtworksLoader,
      })
    ).rejects.toThrowError(
      "[metaphysics @ gravity/v2/me] Error fetching recommended artworks"
    )
  })
})
