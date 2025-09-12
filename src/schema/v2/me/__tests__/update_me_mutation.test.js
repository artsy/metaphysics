/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateMeMutation", () => {
  it("updates the user profile and returns its new data payload", async () => {
    const mutation = gql`
      mutation {
        updateMyUserProfile(
          input: {
            clientMutationId: "1232"
            collectorLevel: 1
            bio: "A very long story"
            iconUrl: "https://gggg.s3.amazonaws.com/thekey"
            location: { address: "123 my street" }
            phone: "1234890"
            priceRangeMax: 1000000000000
            priceRangeMin: -1
            privacy: "public"
            profession: "Juggler"
            receiveLotOpeningSoonNotification: false
            receiveNewSalesNotification: false
            receiveNewWorksNotification: true
            receiveOutbidNotification: false
            receivePromotionNotification: false
            receivePurchaseNotification: false
            receiveSaleOpeningClosingNotification: false
            receiveOrderNotification: false
            receiveViewingRoomNotification: true
            receivePartnerShowNotification: true
            receivePartnerOfferNotification: true
            shareFollows: false
            currencyPreference: EUR
            lengthUnitPreference: CM
          }
        ) {
          user {
            name
            phone
            location {
              city
              address
            }
            priceRange
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
          }
          userOrError {
            ... on UpdateMyProfileMutationSuccess {
              user {
                internalID
              }
            }
            ... on UpdateMyProfileMutationFailure {
              mutationError {
                type
                fieldErrors {
                  name
                  message
                }
              }
            }
          }
          me {
            name
          }
        }
      }
    `

    const mockUpdateMeLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        id: "106",
        location: { address: "123 my street" },
        name: "andy-warhol",
        phone: "1234890",
        price_range: "-1:1000000000000",
        receive_lot_opening_soon_notification: false,
        receive_new_sales_notification: false,
        receive_new_works_notification: true,
        receive_outbid_notification: false,
        receive_promotion_notification: false,
        receive_purchase_notification: false,
        receive_sale_opening_closing_notification: false,
        receive_order_notification: false,
        receive_viewing_room_notification: true,
        receive_partner_show_notification: true,
        receive_partner_offer_notification: true,
        currency_preference: "EUR",
        length_unit_preference: "cm",
      })
    )

    const mockUpdateCollectorProfileIconLoader = jest.fn()

    const context = {
      meLoader: () =>
        Promise.resolve({
          id: "106",
          location: { address: "123 my street" },
          name: "andy-warhol",
          phone: "1234890",
          price_range: "-1:1000000000000",
          receive_lot_opening_soon_notification: true,
          receive_new_sales_notification: true,
          receive_new_works_notification: true,
          receive_outbid_notification: true,
          receive_promotion_notification: true,
          receive_purchase_notification: true,
          receive_sale_opening_closing_notification: true,
          receive_order_notification: true,
          receive_viewing_room_notification: true,
          receive_partner_show_notification: true,
          receive_partner_offer_notification: true,
          currency_preference: "EUR",
          length_unit_preference: "cm",
        }),
      updateMeLoader: mockUpdateMeLoader,
      updateCollectorProfileIconLoader: mockUpdateCollectorProfileIconLoader,
    }

    await runAuthenticatedQuery(mutation, context).then((data) => {
      expect(data).toMatchSnapshot()
    })

    expect(mockUpdateMeLoader).toBeCalledWith({
      client_mutation_id: "1232",
      collector_level: 1,
      bio: "A very long story",
      location: { address: "123 my street" },
      phone: "1234890",
      price_range_max: 1000000000000,
      price_range_min: -1,
      privacy: "public",
      profession: "Juggler",
      receive_lot_opening_soon_notification: false,
      receive_new_sales_notification: false,
      receive_new_works_notification: true,
      receive_outbid_notification: false,
      receive_promotion_notification: false,
      receive_purchase_notification: false,
      receive_sale_opening_closing_notification: false,
      receive_order_notification: false,
      receive_viewing_room_notification: true,
      receive_partner_show_notification: true,
      receive_partner_offer_notification: true,
      share_follows: false,
      currency_preference: "EUR",
      length_unit_preference: "cm",
    })

    expect(mockUpdateCollectorProfileIconLoader).toBeCalledWith({
      source_bucket: "gggg",
      source_key: "thekey",
    })

    expect.assertions(3)
  })

  it("does not update the icon when source url is not from s3", async () => {
    const mutation = gql`
      mutation {
        updateMyUserProfile(
          input: {
            clientMutationId: "1232"
            collectorLevel: 1
            bio: "A very long story"
            iconUrl: "https://gggg.notS3.com/thekey"
            privacy: "public"
          }
        ) {
          user {
            name
            phone
          }
          userOrError {
            ... on UpdateMyProfileMutationSuccess {
              user {
                internalID
              }
            }
            ... on UpdateMyProfileMutationFailure {
              mutationError {
                type
                fieldErrors {
                  name
                  message
                }
              }
            }
          }
          me {
            name
          }
        }
      }
    `

    const mockUpdateMeLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        id: "106",
        location: { address: "123 my street" },
        name: "andy-warhol",
        phone: "1234890",
        price_range: "-1:1000000000000",
        receive_lot_opening_soon_notification: false,
        receive_new_sales_notification: false,
        receive_new_works_notification: true,
        receive_outbid_notification: false,
        receive_promotion_notification: false,
        receive_purchase_notification: false,
        receive_sale_opening_closing_notification: false,
        receive_order_notification: false,
        receive_viewing_room_notification: true,
        receive_partner_show_notification: true,
        receive_partner_offer_notification: true,
      })
    )

    const mockUpdateCollectorProfileIconLoader = jest.fn()

    const context = {
      meLoader: () =>
        Promise.resolve({
          id: "106",
          name: "andy-warhol",
        }),
      updateMeLoader: mockUpdateMeLoader,
      updateCollectorProfileIconLoader: mockUpdateCollectorProfileIconLoader,
    }

    await runAuthenticatedQuery(mutation, context).then((data) => {
      expect(data).toMatchSnapshot()
    })

    expect(mockUpdateMeLoader).toBeCalledWith({
      client_mutation_id: "1232",
      collector_level: 1,
      bio: "A very long story",
      privacy: "public",
    })

    expect(mockUpdateCollectorProfileIconLoader).not.toHaveBeenCalled()
  })

  it("updates phone number and returns correct region code", async () => {
    const mutation = gql`
      mutation {
        updateMyUserProfile(
          input: {
            clientMutationId: "test-mutation-id"
            phone: "416-555-0123"
            phoneCountryCode: "ca"
          }
        ) {
          me {
            phone
            phoneCountryCode
            phoneNumber {
              isValid
              regionCode
              countryCode
              originalNumber
              nationalFormat: display(format: NATIONAL)
              internationalFormat: display(format: INTERNATIONAL)
            }
          }
        }
      }
    `

    const mockUpdateMeLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        id: "test-id",
        phone: "416-555-0123",
        phone_country_code: "CA",
      })
    )

    const mockUpdateCollectorProfileIconLoader = jest.fn()

    const context = {
      meLoader: () =>
        Promise.resolve({
          id: "test-id",
          phone: "416-555-0123",
          phone_country_code: "CA",
        }),
      updateMeLoader: mockUpdateMeLoader,
      updateCollectorProfileIconLoader: mockUpdateCollectorProfileIconLoader,
    }

    await runAuthenticatedQuery(mutation, context).then((data) => {
      expect(mockUpdateMeLoader).toHaveBeenCalledWith({
        client_mutation_id: "test-mutation-id",
        phone: "416-555-0123",
        phone_country_code: "ca",
      })

      expect(data.updateMyUserProfile.me.phone).toBe("416-555-0123")
      expect(data.updateMyUserProfile.me.phoneNumber.isValid).toBe(true)
      expect(data.updateMyUserProfile.me.phoneNumber.regionCode).toBe("ca")
      expect(data.updateMyUserProfile.me.phoneNumber.countryCode).toBe("1")
      expect(data.updateMyUserProfile.me.phoneNumber.originalNumber).toBe(
        "416-555-0123"
      )
      expect(data.updateMyUserProfile.me.phoneNumber.nationalFormat).toBe(
        "(416) 555-0123"
      )
      expect(data.updateMyUserProfile.me.phoneNumber.internationalFormat).toBe(
        "+1 416-555-0123"
      )
    })
  })
})
