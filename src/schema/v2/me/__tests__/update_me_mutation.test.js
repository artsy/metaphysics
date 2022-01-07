/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

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
            privacy: 1
            profession: "Juggler"
            receiveLotOpeningSoonNotification: false
            receiveNewSalesNotification: false
            receiveNewWorksNotification: true
            receiveOutbidNotification: false
            receivePromotionNotification: false
            receivePurchaseNotification: false
            receiveSaleOpeningClosingNotification: false
            shareFollows: false
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
      privacy: 1,
      profession: "Juggler",
      receive_lot_opening_soon_notification: false,
      receive_new_sales_notification: false,
      receive_new_works_notification: true,
      receive_outbid_notification: false,
      receive_promotion_notification: false,
      receive_purchase_notification: false,
      receive_sale_opening_closing_notification: false,
      share_follows: false,
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
            privacy: 1
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
      privacy: 1,
    })

    expect(mockUpdateCollectorProfileIconLoader).not.toHaveBeenCalled()
  })
})
