/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

let context
let orderJson
let artwork
let artworkVersion

describe("Me", () => {
  beforeEach(() => {
    orderJson = {
      ...baseOrderJson,
      available_payment_methods: ["credit card", "wire_transfer"],
      available_stripe_payment_method_types: ["card", "us_bank_account"],
      id: "order-id",
      source: "artwork_page",
      code: "order-code",
      delivery_info: {
        shipper_name: "DHL",
        tracking_id: "12345",
        tracking_url: "track_me.com",
        type: "artsy_shipping",
        estimated_delivery_window: "will arrive at some point",
      },
      mode: "buy",
      currency_code: "USD",
      buyer_id: "buyer-id-1",
      buyer_state: "approved",
      buyer_state_expires_at: "January 1, 2035 19:00 EST",
      buyer_type: "user",
      seller_id: "seller-id-1",
      seller_type: "gallery",
      buyer_total_cents: null,
      items_total_cents: 500000,
      total_list_price_cents: 700000,
      shipping_total_cents: 2000,
      buyer_phone_number: "123-456-7890",
      buyer_phone_number_country_code: "US",
      fulfillment_type: "ship",
      shipping_name: "John Doe",
      shipping_country: "US",
      shipping_postal_code: "10001",
      shipping_region: "NY",
      shipping_city: "New York",
      shipping_address_line1: "123 Main St",
      shipping_address_line2: "Apt 4B",
      tax_total_cents: 4299,
      shipping_origin: "Marfa, TX, US",
      submitted_offers: [],
    }
    artwork = artwork || {
      ...baseArtwork,
      id: orderJson.line_items[0].artwork_id,
    }
    artworkVersion = artworkVersion || {
      ...baseArtwork,
      id: orderJson.line_items[0].artwork_version_id,
    }
  })

  describe("Order", () => {
    it("returns a buyer's order by id", async () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              availablePaymentMethods
              availableStripePaymentMethodTypes
              availableShippingCountries
              buyerTotal {
                display
              }
              buyerState
              buyerStateExpiresAt
              code
              currencyCode
              deliveryInfo {
                shipperName
                trackingNumber
                trackingURL
                estimatedDelivery
                estimatedDeliveryWindow
              }
              displayTexts {
                title
                messageType
              }
              fulfillmentDetails {
                phoneNumber {
                  originalNumber
                }
                phoneNumberCountryCode
                name
                addressLine1
                addressLine2
                city
                region
                country
                postalCode
              }
              fulfillmentOptions {
                type
                amount {
                  currencyCode
                  display
                }
                selected
              }
              internalID
              itemsTotal {
                currencyCode
                display
                minor
              }
              lineItems {
                artwork {
                  title
                }
                artworkVersion {
                  internalID
                }
                currencyCode
                internalID
                listPrice {
                  display
                }
                quantity
              }
              mode
              selectedFulfillmentOption {
                type
              }
              shippingOrigin
              shippingTotal {
                minor
              }
              source
              taxTotal {
                minor
              }
              totalListPrice {
                currencyCode
                display
                minor
              }
              offers {
                internalID
                amount {
                  display
                }
                taxTotal {
                  display
                }
                shippingTotal {
                  display
                }
                note
                fromParticipant
                createdAt
              }
            }
          }
        }
      `

      orderJson.buyer_total_cents = 500000
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        artworkLoader: jest.fn().mockResolvedValue(artwork),
        authenticatedArtworkVersionLoader: jest
          .fn()
          .mockResolvedValue(artworkVersion),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order).toEqual({
        availablePaymentMethods: ["CREDIT_CARD", "WIRE_TRANSFER"],
        availableStripePaymentMethodTypes: ["card", "us_bank_account"],
        availableShippingCountries: ["US", "JP"],
        buyerTotal: {
          display: "US$5,000",
        },
        buyerState: "APPROVED",
        buyerStateExpiresAt: "January 1, 2035 19:00 EST",
        code: "order-code",
        currencyCode: "USD",
        deliveryInfo: {
          shipperName: "DHL",
          trackingNumber: "12345",
          trackingURL: "track_me.com",
          estimatedDelivery: null,
          estimatedDeliveryWindow: "will arrive at some point",
        },
        displayTexts: {
          title: "Congratulations!",
          messageType: "APPROVED_SHIP",
        },
        fulfillmentDetails: {
          addressLine1: "123 Main St",
          addressLine2: "Apt 4B",
          city: "New York",
          country: "US",
          name: "John Doe",
          phoneNumber: {
            originalNumber: "123-456-7890",
          },
          phoneNumberCountryCode: "US",
          postalCode: "10001",
          region: "NY",
        },
        fulfillmentOptions: [
          {
            type: "PICKUP",
            amount: {
              display: "US$0",
              currencyCode: "USD",
            },
            selected: null,
          },
          {
            type: "DOMESTIC_FLAT",
            amount: {
              display: "US$100",
              currencyCode: "USD",
            },
            selected: true,
          },
        ],
        internalID: "order-id",
        itemsTotal: {
          currencyCode: "USD",
          display: "US$5,000",
          minor: 500000,
        },
        lineItems: [
          {
            internalID: "line-item-id-0",
            artwork: {
              title: "Artwork Title",
            },
            artworkVersion: {
              internalID: "artwork-version-id-0",
            },
            currencyCode: "USD",
            listPrice: {
              display: "US$100",
            },
            quantity: 1,
          },
        ],
        mode: "BUY",
        selectedFulfillmentOption: {
          type: "DOMESTIC_FLAT",
        },
        shippingOrigin: "Marfa, TX, US",
        shippingTotal: {
          minor: 2000,
        },
        source: "ARTWORK_PAGE",
        totalListPrice: {
          currencyCode: "USD",
          display: "US$7,000",
          minor: 700000,
        },
        taxTotal: {
          minor: 4299,
        },
        offers: [],
      })
    })

    describe("availableStripePaymentMethodTypes", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              availableStripePaymentMethodTypes
            }
          }
        }
      `

      it("returns available Stripe payment method types", async () => {
        orderJson.available_stripe_payment_method_types = [
          "card",
          "us_bank_account",
          "sepa_debit",
        ]

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.availableStripePaymentMethodTypes).toEqual([
          "card",
          "us_bank_account",
          "sepa_debit",
        ])
      })

      it("returns an empty array when no payment methods are available", async () => {
        orderJson.available_stripe_payment_method_types = []

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.availableStripePaymentMethodTypes).toEqual([])
      })
    })

    describe("offers", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              offers {
                internalID
                amount {
                  display
                  minor
                  currencyCode
                }
                taxTotal {
                  display
                }
                shippingTotal {
                  display
                }
                buyerTotal {
                  display
                  minor
                  currencyCode
                }
                note
                fromParticipant
                createdAt
              }
            }
          }
        }
      `

      it("returns offers when present", async () => {
        orderJson.submitted_offers = [
          {
            id: "offer-1",
            amount_cents: 450000,
            buyer_total_cents: 475000,
            currency_code: "USD",
            from_participant: "buyer",
            note: "This is my offer",
            shipping_total_cents: 2000,
            tax_total_cents: 2300,
            created_at: "2023-01-02T00:00:00Z",
          },
          {
            id: "offer-2",
            amount_cents: 500000,
            buyer_total_cents: 525000,
            currency_code: "USD",
            from_participant: "seller",
            note: null,
            shipping_total_cents: 2000,
            tax_total_cents: 2300,
            created_at: "2023-01-01T00:00:00Z",
          },
        ]

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.offers).toEqual([
          {
            internalID: "offer-1",
            amount: {
              display: "US$4,500",
              minor: 450000,
              currencyCode: "USD",
            },
            taxTotal: {
              display: "US$23",
            },
            shippingTotal: {
              display: "US$20",
            },
            buyerTotal: {
              currencyCode: "USD",
              display: "US$4,750",
              minor: 475000,
            },
            note: "This is my offer",
            fromParticipant: "BUYER",
            createdAt: "2023-01-02T00:00:00Z",
          },
          {
            internalID: "offer-2",
            amount: {
              display: "US$5,000",
              minor: 500000,
              currencyCode: "USD",
            },
            taxTotal: {
              display: "US$23",
            },
            shippingTotal: {
              display: "US$20",
            },
            buyerTotal: {
              currencyCode: "USD",
              display: "US$5,250",
              minor: 525000,
            },
            note: null,
            fromParticipant: "SELLER",
            createdAt: "2023-01-01T00:00:00Z",
          },
        ])
      })

      it("returns empty array when no offers", async () => {
        orderJson.submitted_offers = undefined

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.offers).toEqual([])
      })

      it("returns pricingBreakdownLines for an offer on limited partner offer", async () => {
        orderJson.source = "partner_offer"
        orderJson.mode = "offer"
        orderJson.submitted_offers = [
          {
            id: "offer-1",
            amount_cents: 450000,
            buyer_total_cents: 475000,
            currency_code: "USD",
            from_participant: "buyer",
            note: "This is my offer",
            shipping_total_cents: 2000,
            tax_total_cents: 2300,
            created_at: "2023-01-02T00:00:00Z",
          },
        ]

        const offerQuery = gql`
          query {
            me {
              order(id: "order-id") {
                offers {
                  internalID
                  pricingBreakdownLines {
                    __typename
                    ... on SubtotalLine {
                      displayName
                      amount {
                        display
                        minor
                      }
                    }
                    ... on ShippingLine {
                      displayName
                      amount {
                        display
                      }
                      amountFallbackText
                    }
                    ... on TaxLine {
                      displayName
                      amount {
                        display
                      }
                      amountFallbackText
                    }
                    ... on TotalLine {
                      displayName
                      amount {
                        display
                      }
                      amountFallbackText
                    }
                  }
                }
              }
            }
          }
        `

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(offerQuery, context)

        expect(result.me.order.offers[0].pricingBreakdownLines).toEqual([
          {
            __typename: "SubtotalLine",
            displayName: "Your offer",
            amount: {
              display: "US$4,500",
              minor: 450000,
            },
          },
          {
            __typename: "ShippingLine",
            displayName: "Shipping",
            amount: {
              display: "US$20",
            },
            amountFallbackText: null,
          },
          {
            __typename: "TaxLine",
            displayName: "Tax",
            amount: {
              display: "US$23",
            },
            amountFallbackText: null,
          },
          {
            __typename: "TotalLine",
            displayName: "Total",
            amount: {
              display: "US$4,750",
            },
            amountFallbackText: null,
          },
        ])
      })
    })

    describe("artworkOrEditionSet", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              lineItems {
                artworkOrEditionSet {
                  __typename
                  ... on Artwork {
                    dimensions {
                      in
                      cm
                    }
                  }
                  ... on EditionSet {
                    dimensions {
                      in
                      cm
                    }
                  }
                }
              }
            }
          }
        }
      `
      it("returns artwork details for an artwork line item", async () => {
        orderJson.line_items[0].artwork_id = "artwork-id-1"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue({
            id: "artwork-id-1",
            dimensions: {
              in: "10 x 10",
              cm: "25.4 x 25.4",
            },
          }),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.lineItems[0].artworkOrEditionSet).toEqual({
          __typename: "Artwork",
          dimensions: {
            in: "10 x 10",
            cm: "25.4 x 25.4",
          },
        })
      })

      it("returns edition set details for an edition set line item", async () => {
        orderJson.line_items[0].edition_set_id = "edition-set-id-1"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue({
            edition_sets: [
              {
                id: "edition-set-id-1",
                dimensions: {
                  in: "10 x 10",
                  cm: "25.4 x 25.4",
                },
              },
              {
                id: "edition-set-id-2",
                dimensions: {
                  in: "12 x 12",
                  cm: "30.5 x 30.5",
                },
              },
            ],
          }),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.lineItems[0].artworkOrEditionSet).toEqual({
          __typename: "EditionSet",
          dimensions: {
            in: "10 x 10",
            cm: "25.4 x 25.4",
          },
        })
      })

      it("returns null for artworkOrEditionSet when no artwork or edition set found", async () => {
        orderJson.line_items[0].artwork_id = "unknown-id"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(null),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.lineItems[0].artworkOrEditionSet).toBeNull()
      })
    })

    describe("seller", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              seller {
                __typename
                ... on Partner {
                  name
                  merchantAccount {
                    externalId
                  }
                }
              }
            }
          }
        }
      `

      beforeEach(() => {
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          partnerLoader: jest
            .fn()
            .mockResolvedValue({ id: "partner-id", name: "Kyoto Art Gallery" }),
          partnerMerchantAccountsLoader: jest.fn().mockResolvedValue({
            body: [
              {
                external_id: "acct_123",
              },
            ],
          }),
        }
      })

      it("returns seller details", async () => {
        const result = await runAuthenticatedQuery(query, context)

        expect(result).toEqual({
          me: {
            order: {
              seller: {
                __typename: "Partner",
                name: "Kyoto Art Gallery",
                merchantAccount: {
                  externalId: "acct_123",
                },
              },
            },
          },
        })
      })

      it("returns null seller when partner not found", async () => {
        context.partnerLoader = jest.fn().mockRejectedValue({
          statusCode: 404,
          body: {
            error: "Partner Not Found",
          },
        })

        const result = await runAuthenticatedQuery(query, context)

        expect(result).toEqual({
          me: {
            order: {
              seller: null,
            },
          },
        })
      })

      it("returns null merchant account when no merchant account", async () => {
        context.partnerMerchantAccountsLoader = jest
          .fn()
          .mockResolvedValue({ body: [] })

        const result = await runAuthenticatedQuery(query, context)

        expect(result).toEqual({
          me: {
            order: {
              seller: {
                __typename: "Partner",
                name: "Kyoto Art Gallery",
                merchantAccount: null,
              },
            },
          },
        })
      })
    })

    describe("taxTotal", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              taxTotal {
                minor
              }
            }
          }
        }
      `
      it("returns taxTotal when present", async () => {
        orderJson.tax_total_cents = 4299
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.taxTotal).toEqual({
          minor: 4299,
        })
      })

      it("returns 0 when taxTotal is 0", async () => {
        orderJson.tax_total_cents = 0
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.taxTotal).toEqual({
          minor: 0,
        })
      })

      it("returns null when taxTotal is not present", async () => {
        orderJson.tax_total_cents = null
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.taxTotal).toEqual(null)
      })
    })

    describe("fulfillmentDetails", () => {
      let consoleErrorSpy: jest.SpyInstance
      beforeEach(() => {
        const realConsoleError = console.error
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
        console.error = (...args) => {
          if (args[0] !== "Parse phone number error: ") {
            realConsoleError(...args)
          }
        }
      })
      afterEach(() => {
        consoleErrorSpy.mockRestore()
      })

      it("returns phoneNumber if there is a blank country code", async () => {
        orderJson.buyer_phone_number_country_code = ""
        orderJson.buyer_phone_number = "7738675309"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const query = gql`
          query {
            me {
              order(id: "order-id") {
                fulfillmentDetails {
                  phoneNumber {
                    countryCode
                    regionCode
                    originalNumber
                    isValid
                    display
                  }
                }
              }
            }
          }
        `
        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.fulfillmentDetails.phoneNumber).toEqual({
          countryCode: null,
          regionCode: null,
          originalNumber: "7738675309",
          isValid: false,
          display: null,
        })
      })

      it("returns only countryCode, originalNumber and a null display field if validation fails", async () => {
        orderJson.buyer_phone_number_country_code = "us"
        orderJson.buyer_phone_number = "773867530Z"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const query = gql`
          query {
            me {
              order(id: "order-id") {
                fulfillmentDetails {
                  phoneNumber {
                    countryCode
                    regionCode
                    originalNumber
                    isValid
                    display(format: E164)
                  }
                }
              }
            }
          }
        `
        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.fulfillmentDetails.phoneNumber).toEqual({
          countryCode: "1",
          regionCode: "us",
          originalNumber: "773867530Z",
          isValid: false,
          display: "+1773867530",
        })
      })

      it("returns null if buyer_phone_number is not present", async () => {
        orderJson.buyer_phone_number = null
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const query = gql`
          query {
            me {
              order(id: "order-id") {
                fulfillmentDetails {
                  phoneNumber {
                    countryCode
                    regionCode
                    originalNumber
                    isValid
                    display(format: E164)
                  }
                }
              }
            }
          }
        `
        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.fulfillmentDetails.phoneNumber).toEqual(null)
      })

      it("returns phoneNumber with rich values with a valid region code", async () => {
        orderJson.buyer_phone_number_country_code = "ca"
        orderJson.buyer_phone_number = "7738675309"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const query = gql`
          query {
            me {
              order(id: "order-id") {
                fulfillmentDetails {
                  phoneNumber {
                    countryCode
                    regionCode
                    originalNumber
                    isValid
                    display(format: INTERNATIONAL)
                  }
                }
              }
            }
          }
        `
        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.fulfillmentDetails.phoneNumber).toEqual({
          countryCode: "1",
          display: "+1 773-867-5309",
          isValid: true,
          originalNumber: "7738675309",
          regionCode: "ca",
        })
      })

      it("returns shipping address fields", async () => {
        const query = gql`
          query {
            me {
              order(id: "order-id") {
                fulfillmentDetails {
                  name
                  addressLine1
                  addressLine2
                  city
                  region
                  country
                  postalCode
                }
              }
            }
          }
        `

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.fulfillmentDetails).toEqual({
          name: "John Doe",
          addressLine1: "123 Main St",
          addressLine2: "Apt 4B",
          city: "New York",
          region: "NY",
          country: "US",
          postalCode: "10001",
        })
      })
    })

    describe("pricingBreakdownLines", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              pricingBreakdownLines {
                __typename
                ... on ShippingLine {
                  displayName
                  amountFallbackText
                  amount {
                    display
                    amount
                    currencySymbol
                  }
                }
                ... on TaxLine {
                  displayName
                  amountFallbackText
                  amount {
                    display
                    amount
                    currencySymbol
                  }
                }
                ... on SubtotalLine {
                  displayName
                  amount {
                    display
                    amount
                    currencySymbol
                  }
                }
                ... on TotalLine {
                  displayName
                  amountFallbackText
                  amount {
                    display
                    amount
                    currencySymbol
                  }
                }
              }
            }
          }
        }
      `
      it("returns the correct pricing breakdown lines with all values present", async () => {
        orderJson.items_total_cents = 500000
        orderJson.shipping_total_cents = 2000
        orderJson.tax_total_cents = 4299
        orderJson.buyer_total_cents = 506299
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.pricingBreakdownLines).toEqual([
          {
            __typename: "SubtotalLine",
            displayName: "Price",
            amount: {
              display: "US$5,000",
              currencySymbol: "$",
              amount: "5,000",
            },
          },
          {
            __typename: "ShippingLine",
            displayName: "Flat rate shipping",
            amountFallbackText: null,
            amount: {
              display: "US$20",
              currencySymbol: "$",
              amount: "20",
            },
          },
          {
            __typename: "TaxLine",
            displayName: "Tax",
            amountFallbackText: null,
            amount: {
              display: "US$42.99",
              currencySymbol: "$",
              amount: "42.99",
            },
          },
          {
            __typename: "TotalLine",
            displayName: "Total",
            amountFallbackText: null,
            amount: {
              display: "US$5,062.99",
              currencySymbol: "$",
              amount: "5,062.99",
            },
          },
        ])
      })

      it("returns the correct pricing breakdown lines with missing values", async () => {
        orderJson.items_total_cents = 500000
        orderJson.shipping_total_cents = null
        orderJson.tax_total_cents = null
        orderJson.buyer_total_cents = null
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }
        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.pricingBreakdownLines).toEqual([
          {
            __typename: "SubtotalLine",
            displayName: "Price",
            amount: {
              display: "US$5,000",
              currencySymbol: "$",
              amount: "5,000",
            },
          },
          {
            __typename: "ShippingLine",
            displayName: "Flat rate shipping",
            amountFallbackText: "Calculated in next steps",
            amount: null,
          },
          {
            __typename: "TaxLine",
            displayName: "Tax",
            amountFallbackText: "Calculated in next steps",
            amount: null,
          },
          {
            __typename: "TotalLine",
            displayName: "Total",
            amountFallbackText: "Waiting for final costs",
            amount: null,
          },
        ])
      })

      describe("Subtotal line", () => {
        const query = gql`
          query {
            me {
              order(id: "order-id") {
                pricingBreakdownLines {
                  __typename
                  ... on SubtotalLine {
                    displayName
                    amount {
                      amount
                    }
                  }
                }
              }
            }
          }
        `

        it("always uses items_total_cents for subtotal", async () => {
          orderJson.items_total_cents = 750000
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
              displayName: "Price",
              amount: { amount: "7,500" },
            },
            { __typename: "ShippingLine" },
            { __typename: "TaxLine" },
            { __typename: "TotalLine" },
          ])
        })

        it("returns 'Price' displayName when buyer makes offer on top of limited partner offer", async () => {
          orderJson.source = "partner_offer"
          orderJson.mode = "offer"
          orderJson.items_total_cents = 600000
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
              displayName: "Price",
              amount: { amount: "6,000" },
            },
            { __typename: "ShippingLine" },
            { __typename: "TaxLine" },
            { __typename: "TotalLine" },
          ])
        })

        it("returns 'Gallery offer' displayName for limited partner offer in buy mode", async () => {
          orderJson.source = "partner_offer"
          orderJson.mode = "buy"
          orderJson.items_total_cents = 500000
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
              displayName: "Gallery offer",
              amount: { amount: "5,000" },
            },
            { __typename: "ShippingLine" },
            { __typename: "TaxLine" },
            { __typename: "TotalLine" },
          ])
        })
      })

      describe("Shipping line display names", () => {
        const query = gql`
          query {
            me {
              order(id: "order-id") {
                pricingBreakdownLines {
                  __typename
                  ... on ShippingLine {
                    displayName
                    amountFallbackText
                    amount {
                      amount
                    }
                  }
                }
              }
            }
          }
        `

        it("returns a shipping line for type pickup", async () => {
          orderJson.items_total_cents = 500000
          orderJson.shipping_total_cents = 0
          orderJson.selected_fulfillment_option = {
            type: "pickup",
            selected: true,
          }
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
            },

            {
              __typename: "ShippingLine",
              displayName: "Pickup",
              amountFallbackText: null,
              amount: {
                amount: "0",
              },
            },
            {
              __typename: "TaxLine",
            },
            {
              __typename: "TotalLine",
            },
          ])
        })

        it("returns the correct display name for shipping line with free international shipping", async () => {
          orderJson.items_total_cents = 500000
          orderJson.shipping_total_cents = 0
          orderJson.selected_fulfillment_option = {
            type: "international_flat",
            selected: true,
          }
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
            },
            {
              __typename: "ShippingLine",
              displayName: "Free shipping",
              amountFallbackText: null,
              amount: {
                amount: "0",
              },
            },
            {
              __typename: "TaxLine",
            },
            {
              __typename: "TotalLine",
            },
          ])
        })

        it("returns the correct display name for free domestic shipping", async () => {
          orderJson.items_total_cents = 500000
          orderJson.shipping_total_cents = 0
          orderJson.selected_fulfillment_option = {
            type: "domestic_flat",
            selected: true,
          }
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
            },
            {
              __typename: "ShippingLine",
              displayName: "Free shipping",
              amountFallbackText: null,
              amount: {
                amount: "0",
              },
            },
            {
              __typename: "TaxLine",
            },
            {
              __typename: "TotalLine",
            },
          ])
        })

        it("returns the correct display name for flat fee domestic shipping", async () => {
          orderJson.items_total_cents = 500000
          orderJson.shipping_total_cents = 420
          orderJson.selected_fulfillment_option = {
            type: "domestic_flat",
            selected: true,
          }
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
            },
            {
              __typename: "ShippingLine",
              displayName: "Flat rate shipping",
              amountFallbackText: null,
              amount: {
                amount: "4.20",
              },
            },
            {
              __typename: "TaxLine",
            },
            {
              __typename: "TotalLine",
            },
          ])
        })

        it("returns the correct display name for flat fee international shipping", async () => {
          orderJson.items_total_cents = 500000
          orderJson.shipping_total_cents = 420
          orderJson.selected_fulfillment_option = {
            type: "international_flat",
            selected: true,
          }

          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
            artworkLoader: jest.fn().mockResolvedValue(artwork),
            authenticatedArtworkVersionLoader: jest
              .fn()
              .mockResolvedValue(artworkVersion),
          }
          const result = await runAuthenticatedQuery(query, context)
          expect(result.me.order.pricingBreakdownLines).toEqual([
            {
              __typename: "SubtotalLine",
            },
            {
              __typename: "ShippingLine",
              displayName: "Flat rate shipping",
              amountFallbackText: null,
              amount: {
                amount: "4.20",
              },
            },
            {
              __typename: "TaxLine",
            },
            {
              __typename: "TotalLine",
            },
          ])
        })
      })
    })

    describe("paymentDetails", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              creditCardWalletType
              paymentMethod
              stripeConfirmationToken
              paymentMethodDetails {
                __typename
                ... on CreditCard {
                  brand
                  lastDigits
                  expirationYear
                  expirationMonth
                }
                ... on BankAccount {
                  bankName
                  last4
                }
                ... on WireTransfer {
                  isManualPayment
                }
              }
            }
          }
        }
      `

      it("returns credit card wallet type", async () => {
        orderJson.credit_card_wallet_type = "apple_pay"
        orderJson.payment_method = "credit card"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.creditCardWalletType).toEqual("APPLE_PAY")
      })

      it("returns credit card details", async () => {
        orderJson.payment_method = "credit card"
        orderJson.credit_card_id = "credit-card-id"

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          creditCardLoader: jest.fn().mockResolvedValue({
            brand: "Visa",
            last_digits: "1234",
            expiration_year: 2025,
            expiration_month: 12,
          }),
        }

        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.paymentMethodDetails).toEqual({
          __typename: "CreditCard",
          brand: "Visa",
          lastDigits: "1234",
          expirationYear: 2025,
          expirationMonth: 12,
        })
      })

      it("returns ach bank account details", async () => {
        orderJson.payment_method = "us_bank_account"
        orderJson.bank_account_id = "ach-account-id"

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          bankAccountLoader: jest.fn().mockResolvedValue({
            bank_name: "Bank of America",
            last4: "1234",
          }),
        }

        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.paymentMethodDetails).toEqual({
          __typename: "BankAccount",
          bankName: "Bank of America",
          last4: "1234",
        })
      })

      it("returns sepa bank account details", async () => {
        orderJson.payment_method = "sepa_debit"
        orderJson.bank_account_id = "bank-account-id"

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          bankAccountLoader: jest.fn().mockResolvedValue({
            bank_name: "Commerzebank",
            last4: "6789",
          }),
        }

        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.paymentMethodDetails).toEqual({
          __typename: "BankAccount",
          bankName: "Commerzebank",
          last4: "6789",
        })
      })

      it("returns wire transfer details", async () => {
        orderJson.payment_method = "wire_transfer"

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.paymentMethodDetails).toEqual({
          __typename: "WireTransfer",
          isManualPayment: true,
        })
      })

      it("returns stripe confirmation token", async () => {
        orderJson.stripe_confirmation_token = "ctoken_123"

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)
        expect(result.me.order.stripeConfirmationToken).toEqual("ctoken_123")
      })
    })

    describe("buyerState", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              buyerState
            }
          }
        }
      `
      it("defaults to null if nothing is present", async () => {
        orderJson.buyer_state = null
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.buyerState).toEqual(null)
      })

      it("defaults to UNKNOWN if the status is not mapped", async () => {
        orderJson.buyer_state = "invalid_state"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
          authenticatedArtworkVersionLoader: jest
            .fn()
            .mockResolvedValue(artworkVersion),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.buyerState).toEqual("UNKNOWN")
      })
    })

    describe("currencySymbol on order", () => {
      it("returns the disambiguated symbol by default", async () => {
        orderJson.currency_code = "USD"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }
        const result = await runAuthenticatedQuery(
          gql`
            query {
              me {
                order(id: "order-id") {
                  currencySymbol
                }
              }
            }
          `,
          context
        )
        expect(result.me.order.currencySymbol).toEqual("US$")
      })

      it("returns bare symbol when disambiguate is false", async () => {
        orderJson.currency_code = "USD"
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }
        const result = await runAuthenticatedQuery(
          gql`
            query {
              me {
                order(id: "order-id") {
                  currencySymbol(disambiguate: false)
                }
              }
            }
          `,
          context
        )
        expect(result.me.order.currencySymbol).toEqual("$")
      })

      it("returns empty string when currency_code is absent", async () => {
        delete orderJson.currency_code
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }
        const result = await runAuthenticatedQuery(
          gql`
            query {
              me {
                order(id: "order-id") {
                  currencySymbol
                }
              }
            }
          `,
          context
        )
        expect(result.me.order.currencySymbol).toEqual("")
      })
    })

    describe("currencySymbol on lineItems", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              lineItems {
                currencySymbol
              }
            }
          }
        }
      `

      it("returns the correct symbol for USD", async () => {
        orderJson.line_items = [
          { ...orderJson.line_items[0], currency_code: "USD" },
        ]
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.lineItems[0].currencySymbol).toEqual("US$")
      })

      it("returns the correct symbol for EUR", async () => {
        orderJson.line_items = [
          { ...orderJson.line_items[0], currency_code: "EUR" },
        ]
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.lineItems[0].currencySymbol).toEqual("€")
      })

      it("returns empty string when currency_code is absent", async () => {
        delete orderJson.line_items[0].currency_code
        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.lineItems[0].currencySymbol).toEqual("")
      })

      describe("disambiguate argument", () => {
        const disambiguateQuery = gql`
          query {
            me {
              order(id: "order-id") {
                lineItems {
                  currencySymbol(disambiguate: false)
                }
              }
            }
          }
        `

        it("strips the country prefix for USD when disambiguate is false", async () => {
          orderJson.line_items = [
            { ...orderJson.line_items[0], currency_code: "USD" },
          ]
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          }

          const result = await runAuthenticatedQuery(disambiguateQuery, context)

          expect(result.me.order.lineItems[0].currencySymbol).toEqual("$")
        })

        it("returns the symbol unchanged for EUR when disambiguate is false", async () => {
          orderJson.line_items = [
            { ...orderJson.line_items[0], currency_code: "EUR" },
          ]
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          }

          const result = await runAuthenticatedQuery(disambiguateQuery, context)

          expect(result.me.order.lineItems[0].currencySymbol).toEqual("€")
        })

        it("strips the country prefix for FKP (Falkland Islands pound) when disambiguate is false", async () => {
          orderJson.line_items = [
            { ...orderJson.line_items[0], currency_code: "FKP" },
          ]
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          }

          const result = await runAuthenticatedQuery(disambiguateQuery, context)

          expect(result.me.order.lineItems[0].currencySymbol).toEqual("£")
        })

        it("strips the country prefix for PLN (Polish złoty) when disambiguate is false", async () => {
          orderJson.line_items = [
            { ...orderJson.line_items[0], currency_code: "PLN" },
          ]
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          }

          const result = await runAuthenticatedQuery(disambiguateQuery, context)

          expect(result.me.order.lineItems[0].currencySymbol).toEqual("zł")
        })

        it("strips the country prefix for CNY (Chinese yuan) when disambiguate is false", async () => {
          orderJson.line_items = [
            { ...orderJson.line_items[0], currency_code: "CNY" },
          ]
          context = {
            meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
            meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          }

          const result = await runAuthenticatedQuery(disambiguateQuery, context)

          expect(result.me.order.lineItems[0].currencySymbol).toEqual("¥")
        })
      })
    })

    describe("Money field decimal formatting", () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              buyerTotal {
                display
                amount
              }
              itemsTotal {
                display
                amount
              }
              shippingTotal {
                display
                amount
              }
              taxTotal {
                display
                amount
              }
              lineItems {
                listPrice {
                  display
                  amount
                }
              }
            }
          }
        }
      `

      it("formats money fields with .00 decimal places for whole dollar amounts", async () => {
        orderJson.buyer_total_cents = 500000
        orderJson.items_total_cents = 500000
        orderJson.shipping_total_cents = 2000
        orderJson.tax_total_cents = 5000
        orderJson.line_items[0].list_price_cents = 10000

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.buyerTotal.display).toEqual("US$5,000")
        expect(result.me.order.buyerTotal.amount).toEqual("5,000")
        expect(result.me.order.itemsTotal.display).toEqual("US$5,000")
        expect(result.me.order.itemsTotal.amount).toEqual("5,000")
        expect(result.me.order.shippingTotal.display).toEqual("US$20")
        expect(result.me.order.shippingTotal.amount).toEqual("20")
        expect(result.me.order.taxTotal.display).toEqual("US$50")
        expect(result.me.order.taxTotal.amount).toEqual("50")
        expect(result.me.order.lineItems[0].listPrice.display).toEqual("US$100")
        expect(result.me.order.lineItems[0].listPrice.amount).toEqual("100")
      })

      it("formats money fields with exact decimal places for fractional amounts", async () => {
        orderJson.buyer_total_cents = 506299
        orderJson.items_total_cents = 500099
        orderJson.shipping_total_cents = 2099
        orderJson.tax_total_cents = 4299
        orderJson.line_items[0].list_price_cents = 10050

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
          artworkLoader: jest.fn().mockResolvedValue(artwork),
        }

        const result = await runAuthenticatedQuery(query, context)

        expect(result.me.order.buyerTotal.display).toEqual("US$5,062.99")
        expect(result.me.order.buyerTotal.amount).toEqual("5,062.99")
        expect(result.me.order.itemsTotal.display).toEqual("US$5,000.99")
        expect(result.me.order.itemsTotal.amount).toEqual("5,000.99")
        expect(result.me.order.shippingTotal.display).toEqual("US$20.99")
        expect(result.me.order.shippingTotal.amount).toEqual("20.99")
        expect(result.me.order.taxTotal.display).toEqual("US$42.99")
        expect(result.me.order.taxTotal.amount).toEqual("42.99")
        expect(result.me.order.lineItems[0].listPrice.display).toEqual(
          "US$100.50"
        )
        expect(result.me.order.lineItems[0].listPrice.amount).toEqual("100.50")
      })

      it("formats commission fee, seller total, and transaction fee with .00 decimals", async () => {
        orderJson.commission_fee_cents = 50000
        orderJson.seller_total_cents = 450000
        orderJson.transaction_fee_cents = 15000

        const commissionQuery = gql`
          query {
            me {
              order(id: "order-id") {
                commissionFee {
                  display
                  amount
                }
                sellerTotal {
                  display
                  amount
                }
                transactionFee {
                  display
                  amount
                }
              }
            }
          }
        `

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(commissionQuery, context)

        expect(result.me.order.commissionFee.display).toEqual("US$500")
        expect(result.me.order.commissionFee.amount).toEqual("500")
        expect(result.me.order.sellerTotal.display).toEqual("US$4,500")
        expect(result.me.order.sellerTotal.amount).toEqual("4,500")
        expect(result.me.order.transactionFee.display).toEqual("US$150")
        expect(result.me.order.transactionFee.amount).toEqual("150")
      })

      it("formats total list price with .00 decimals", async () => {
        orderJson.total_list_price_cents = 700000

        const totalListPriceQuery = gql`
          query {
            me {
              order(id: "order-id") {
                totalListPrice {
                  display
                  amount
                }
              }
            }
          }
        `

        context = {
          meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
          meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        }

        const result = await runAuthenticatedQuery(totalListPriceQuery, context)

        expect(result.me.order.totalListPrice.display).toEqual("US$7,000")
        expect(result.me.order.totalListPrice.amount).toEqual("7,000")
      })
    })
  })
})
