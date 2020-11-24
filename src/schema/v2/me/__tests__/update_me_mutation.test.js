/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("UpdateMeMutation", () => {
  it("updates the user profile and returns its new data payload", async () => {
    const mutation = gql`
      mutation {
        updateMyUserProfile(
          input: {
            collectorLevel: 1
            clientMutationId: "1232"
            phone: "1234890"
            location: { address: "123 my street" }
            priceRangeMin: -1
            priceRangeMax: 1000000000000
            receivePurchaseNotification: false
            receiveOutbidNotification: false
            receiveLotOpeningSoonNotification: false
            receiveSaleOpeningClosingNotification: false
            receiveNewWorksNotification: true
            receiveNewSalesNotification: false
            receivePromotionNotification: false
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

    const context = {
      meLoader: () =>
        Promise.resolve({
          id: "106",
          name: "andy-warhol",
          phone: "1234890",
          location: {
            address: "123 my street",
          },
          price_range: "-1:1000000000000",
          receive_purchase_notification: true,
          receive_outbid_notification: true,
          receive_lot_opening_soon_notification: true,
          receive_sale_opening_closing_notification: true,
          receive_new_works_notification: true,
          receive_new_sales_notification: true,
          receive_promotion_notification: true,
        }),
      updateMeLoader: () =>
        Promise.resolve({
          id: "106",
          name: "andy-warhol",
          phone: "1234890",
          location: {
            address: "123 my street",
          },
          price_range: "-1:1000000000000",
          receive_purchase_notification: false,
          receive_outbid_notification: false,
          receive_lot_opening_soon_notification: false,
          receive_sale_opening_closing_notification: false,
          receive_new_works_notification: true,
          receive_new_sales_notification: false,
          receive_promotion_notification: false,
        }),
    }

    await runAuthenticatedQuery(mutation, context).then((data) => {
      expect(data).toMatchSnapshot()
    })
    expect.assertions(1)
  })
})
