import {
  nameOldEigenQueries,
  rewriteEcommerceMutations,
  shouldRewriteEcommerceMutations,
  shouldAddQueryToMutations,
} from "lib/modifyOldEigenQueries"
import gql from "lib/gql"

let beforeOffer: string
let beforeOrder: string
let savedArtworksQuery = gql`
  {
    me {
      saved_artworks {
        artworks_connection(private: true) {
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
`

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
    expect(rewriteEcommerceMutations(beforeOffer)).toMatchInlineSnapshot(`
"
      mutation createOfferOrder($artworkId: String!, $quantity: Int) {
        ecommerceCreateOfferOrderWithArtwork: commerceCreateOfferOrderWithArtwork(
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
    "
`)
  })

  it("renames Exchange create order", () => {
    expect(rewriteEcommerceMutations(beforeOrder)).toMatchInlineSnapshot(`
"
      mutation createOrder($input: CommerceCreateOrderWithArtworkInput!) {
        ecommerceCreateOrderWithArtwork: commerceCreateOrderWithArtwork(input: $input) {
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
    "
`)
  })
})

describe(shouldRewriteEcommerceMutations, () => {
  it("shoud re-write", () => {
    expect(shouldRewriteEcommerceMutations(beforeOffer)).toBeTruthy()
  })
})

describe(shouldAddQueryToMutations, () => {
  it("doesn't do it on an offer mutation", () => {
    expect(shouldAddQueryToMutations(beforeOffer)).toBeFalsy()
  })
  it("does modify with eigen's saved_artworks query", () => {
    expect(shouldAddQueryToMutations(savedArtworksQuery)).toBeTruthy()
  })
})
