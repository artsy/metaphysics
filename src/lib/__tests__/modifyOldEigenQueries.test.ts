import {
  nameOldEigenQueries,
  rewriteEcommerceMutations,
} from "lib/modifyOldEigenQueries"
import gql from "lib/gql"

describe(nameOldEigenQueries, () => {
  it("renames Exchange create offer", () => {
    const before = gql`
      mutation createOfferOrder($artworkId: String!, $quantity: Int) {
        ecommerceCreateOfferOrderWithArtwork(
          input: { artworkId: $artworkId, quantity: $quantity }
        ) {
          orderOrError {
            ... on OrderWithMutationSuccess {
              order {
                id
              }
            }
            ... on OrderWithMutationFailure {
              error {
                type
                code
                data
              }
            }
          }
        }
      }
    `

    const after = gql`
      mutation createOfferOrder($artworkId: String!, $quantity: Int) {
        commerceCreateOfferOrderWithArtwork(
          input: { artworkId: $artworkId, quantity: $quantity }
        ) {
          orderOrError {
            ... on CommerceOrderWithMutationSuccess {
              order {
                id
              }
            }
            ... on CommerceOrderWithMutationFailure {
              error {
                type
                code
                data
              }
            }
          }
        }
      }
    `

    expect(rewriteEcommerceMutations(before)).toEqual(after)
  })

  it("renames Exchange create order", () => {
    const before = gql`
      mutation createOrder($input: CreateOrderWithArtworkInput!) {
        ecommerceCreateOrderWithArtwork(input: $input) {
          orderOrError {
            ... on OrderWithMutationSuccess {
              order {
                id
              }
            }
            ... on OrderWithMutationFailure {
              error {
                type
                code
                data
              }
            }
          }
        }
      }
    `

    const after = gql`
      mutation createOrder($input: CreateOrderWithArtworkInput!) {
        commerceCreateOrderWithArtwork(input: $input) {
          orderOrError {
            ... on CommerceOrderWithMutationSuccess {
              order {
                id
              }
            }
            ... on CommerceOrderWithMutationFailure {
              error {
                type
                code
                data
              }
            }
          }
        }
      }
    `

    expect(rewriteEcommerceMutations(before)).toEqual(after)
  })
})
