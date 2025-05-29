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
      id: "order-id",
      source: "artwork_page",
      code: "order-code",
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
              availableShippingCountries
              buyerTotal {
                display
              }
              buyerStateExpiresAt
              code
              currencyCode
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
        availableShippingCountries: ["US", "JP"],
        buyerTotal: {
          display: "US$5,000",
        },
        buyerStateExpiresAt: "January 1, 2035 19:00 EST",
        code: "order-code",
        currencyCode: "USD",
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
        orderJson.buyer_phone_number_country_code = "us"
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
          regionCode: "us",
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
            displayName: "Subtotal",
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
            displayName: "Subtotal",
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
    })
  })
})
