import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { computeImageSources } from "../myCollectionCreateArtworkMutation"

const newArtwork = { id: "some-artwork-id" }
const newArtist = { id: "some-artist-id" }
const createArtworkLoader = jest.fn().mockResolvedValue(newArtwork)
const createArtistLoader = jest.fn().mockResolvedValue(newArtist)

const artworkDetails = {
  medium: "Painting",
  price_paid_cents: 10000,
  price_paid_currency: "USD",
  artwork_location: "Berlin, Germany",
  collector_location: { country: "Germany", city: "Berlin" },
  attribution_class: "open edition",
}
const artworkLoader = jest.fn().mockResolvedValue(artworkDetails)

const createImageLoader = jest.fn()

const computeMutationInput = ({
  externalImageUrls = [],
  editionSize = null,
  editionNumber = null,
  isEdition = null,
  artists = null,
}: {
  externalImageUrls?: string[]
  editionSize?: string | null
  editionNumber?: string | null
  isEdition?: boolean | null
  artists?: any[] | null
} = {}): string => {
  const mutation = gql`
    mutation {
      myCollectionCreateArtwork(
        input: {
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          artists: [${
            artists
              ? artists.map(
                  (artist) => `{ displayName: "${artist.displayName}" }`
                )
              : null
          }],
          category: "some strange category"
          costCurrencyCode: "USD"
          costMinor: 200
          date: "1990"
          depth: "20"
          isEdition: ${JSON.stringify(isEdition)}
          editionNumber: ${JSON.stringify(editionNumber)}
          editionSize: ${JSON.stringify(editionSize)}
          externalImageUrls: ${JSON.stringify(externalImageUrls)}
          height: "20"
          artworkLocation: "Berlin, Germany"
          collectorLocation: {country: "Germany", city: "Berlin"}
          medium: "Painting"
          metric: "in"
          pricePaidCents: 10000
          pricePaidCurrency: "USD"
          provenance: "Pat Hearn Gallery"
          title: "hey now"
          width: "20"
          importSource: CONVECTION
        }
      ) {
        artworkOrError {
          ... on MyCollectionArtworkMutationSuccess {
            artwork {
              medium
              artworkLocation
              collectorLocation {
                city
                country
              }
              pricePaid {
                display
              }
            }
            artworkEdge {
              node {
                medium
                attributionClass{
                  name
                }
              }
            }
          }
          ... on MyCollectionArtworkMutationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  return mutation
}

const createArtworkEditionSetLoader = jest.fn()
const defaultContext = {
  createArtworkLoader,
  createArtistLoader,
  artworkLoader: artworkLoader,
  createArtworkImageLoader: createImageLoader,
  createArtworkEditionSetLoader,
}

describe("myCollectionCreateArtworkMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when the server responds with an error", () => {
    it("returns that error", async () => {
      const mutation = computeMutationInput()

      const serverError = "Error creating artwork"
      const url =
        "https://stagingapi.artsy.net/api/v1/my_collection?id=some-artwork-id"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        createArtworkLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionCreateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })
  })

  describe("when the server response is successful", () => {
    it("returns details of the new artwork", async () => {
      const mutation = computeMutationInput()

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toEqual({
        artwork: {
          medium: "Painting",
          pricePaid: {
            display: "$100",
          },
          artworkLocation: "Berlin, Germany",
          collectorLocation: {
            city: "Berlin",
            country: "Germany",
          },
        },
        artworkEdge: {
          node: {
            medium: "Painting",
            attributionClass: {
              name: "Open edition",
            },
          },
        },
      })
    })
  })

  describe("creating additional artists", () => {
    it("creates additional artists", async () => {
      const mutation = computeMutationInput({
        artists: [
          {
            displayName: "Artist 1",
          },
          {
            displayName: "Artist 2",
          },
        ],
      })

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(createArtistLoader).toBeCalledWith({
        display_name: "Artist 1",
        is_personal_artist: true,
      })
      expect(createArtistLoader).toBeCalledWith({
        display_name: "Artist 2",
        is_personal_artist: true,
      })

      expect(createArtworkLoader).toBeCalledWith({
        artists: [
          "4d8b92b34eb68a1b2c0003f4",
          "some-artist-id",
          "some-artist-id",
        ],
        artwork_location: "Berlin, Germany",
        attribution_class: undefined,
        category: "some strange category",
        collection_id: "my-collection",
        collector_location: { city: "Berlin", country: "Germany" },
        cost_currency_code: "USD",
        cost_minor: 200,
        date: "1990",
        depth: "20",
        height: "20",
        import_source: "convection",
        medium: "Painting",
        metric: "in",
        price_paid_cents: 10000,
        price_paid_currency: "USD",
        provenance: "Pat Hearn Gallery",
        submission_id: undefined,
        title: "hey now",
        width: "20",
      })
      expect(artworkOrError).toHaveProperty("artwork")
    })
  })

  describe("creating additional images", () => {
    it("creates an additional image with bucket and key with a valid image url", async () => {
      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput({ externalImageUrls })

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(newArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })
    })

    it("returns an error when the additional image can't be created", async () => {
      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput({ externalImageUrls })

      const serverError = "Error creating image"
      const url =
        "https://stagingapi.artsy.net/api/v1/artwork/some-artwork-id/images"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        createArtworkImageLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionCreateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })

    it("creates additional images in sequence to avoid a gravity race condition", async () => {
      // allow us to resolve the createImageLoader mock manually
      let resolveCreateImageLoader = () => null as any
      createImageLoader.mockImplementation(
        () =>
          new Promise<void>((resolve) => (resolveCreateImageLoader = resolve))
      )

      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
        "https://test-upload-bucket.s3.amazonaws.com/path/to/other/image.jpg",
      ]
      const mutation = computeMutationInput({ externalImageUrls })

      runAuthenticatedQuery(mutation, defaultContext)

      // flush promise queue
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(createImageLoader).toHaveBeenCalledTimes(1)
      expect(createImageLoader).toBeCalledWith(newArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })

      resolveCreateImageLoader()

      // flush promise queue
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(createImageLoader).toHaveBeenCalledTimes(2)
      expect(createImageLoader).toBeCalledWith(newArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/other/image.jpg",
      })
    })
  })

  describe("setting edition set info", () => {
    it("creates an edition set on the artwork", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
        editionSize: "100",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        newArtwork.id,
        {
          edition_size: "100",
          available_editions: ["50"],
        }
      )
    })

    it("works if you only specify the edition number", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        newArtwork.id,
        {
          available_editions: ["50"],
        }
      )
    })

    it("works if you only specify the edition size", async () => {
      const mutation = computeMutationInput({
        editionSize: "50",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        newArtwork.id,
        {
          edition_size: "50",
        }
      )
    })

    it("does not create an edition set if you don't specify either", async () => {
      const mutation = computeMutationInput({
        editionNumber: null,
        editionSize: null,
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).not.toHaveBeenCalled()
    })

    it("does create an edition set if you pass `isEdition`", async () => {
      const mutation = computeMutationInput({
        isEdition: true,
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        newArtwork.id,
        {}
      )
    })
  })
})

describe("computeImageSources", () => {
  it("returns and empty array with an empty list of external urls", () => {
    const externalImageUrls = []
    const imageSources = computeImageSources(externalImageUrls)
    expect(imageSources).toEqual([])
  })

  it("filters out urls that don't match the regex", () => {
    const externalImageUrls = ["http://example.com/path/to/image.jpg"]
    const imageSources = computeImageSources(externalImageUrls)
    expect(imageSources).toEqual([])
  })

  it("returns source params for urls that match the regex", () => {
    const externalImageUrls = [
      "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
    ]
    const imageSources = computeImageSources(externalImageUrls)
    expect(imageSources).toEqual([
      { source_bucket: "test-upload-bucket", source_key: "path/to/image.jpg" },
    ])
  })

  it("tests all passed URLs", () => {
    const externalImageUrls = [
      "http://example.com/path/to/image.jpg",
      "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
    ]
    const imageSources = computeImageSources(externalImageUrls)
    expect(imageSources.length).toEqual(1)
  })
})
