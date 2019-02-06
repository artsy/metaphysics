import {
  nameOldEigenQueries,
  rewriteEcommerceMutations,
  shouldRewriteEcommerceMutations,
} from "lib/modifyOldEigenQueries"
import gql from "lib/gql"

let beforeOffer: string
let beforeOrder: string

describe(nameOldEigenQueries, () => {
  beforeAll(() => {
    beforeOffer = gql`
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
    beforeOrder = gql`
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
  })

  it("renames Exchange create offer", () => {
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

    expect(rewriteEcommerceMutations(beforeOffer)).toEqual(after)
  })

  it("renames Exchange create order", () => {
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

    expect(rewriteEcommerceMutations(beforeOrder)).toEqual(after)
  })
})

describe(shouldRewriteEcommerceMutations, () => {
  it("doesn't re-write when flag is off", () => {
    expect(shouldRewriteEcommerceMutations({}, beforeOffer)).toBeFalsy()
  })
  it("does re-write when flag is on", () => {
    expect(
      shouldRewriteEcommerceMutations(
        { ENABLE_COMMERCE_STITCHING: true },
        beforeOffer
      )
    ).toBeTruthy()
  })
})
