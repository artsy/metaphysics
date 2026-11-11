import { createResaleSubmissionStubLoaders } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"

// The stubs read the last two hex digits: last even = sellable, second-last even = marketplace.
export const MARKETPLACE_ARTWORK_ID = "5f00000000000000000000a0"
export const AUCTION_ARTWORK_ID = "5f00000000000000000000b0"
export const REJECTED_ARTWORK_ID = "5f00000000000000000000a1"

export const stubLoaders = (
  myCollectionArtworksLoader: any = jest.fn(() =>
    Promise.resolve({ body: [], headers: { "x-total-count": "0" } })
  )
) => createResaleSubmissionStubLoaders("user-42", myCollectionArtworksLoader)
export const meLoader = jest.fn(() => Promise.resolve({ id: "user-42" }))
