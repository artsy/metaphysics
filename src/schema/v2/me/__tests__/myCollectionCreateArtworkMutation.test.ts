import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import {
  computeImageSources,
  transformToPricePaidCents,
} from "../myCollectionCreateArtworkMutation"

const newArtwork = { id: "some-artwork-id" }
const newArtist = { id: "some-artist-id" }
const artworkDetails = {
  additional_information: "additional info",
  id: "some-artwork-id",
  certificate_of_authenticity: true,
  coa_by_authenticating_body: false,
  coa_by_gallery: true,
  medium: "Painting",
  price_paid_cents: 10000,
  price_paid_currency: "USD",
  artwork_location: "Berlin, Germany",
  collector_location: { country: "Germany", city: "Berlin" },
  condition: "very_good",
  condition_description: "like a new!",
  attribution_class: "open edition",
  images: [
    {
      aspect_ratio: 1,
    },
  ],
  signature: "artist initials",
  signed_other: true,
  framed: true,
  framed_metric: "in",
  framed_depth: "1",
  framed_height: "21",
  framed_width: "21",
}

const createArtworkLoader = jest.fn().mockResolvedValue(newArtwork)
const createArtistLoader = jest.fn().mockResolvedValue(newArtist)
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
          additionalInformation: "additional info"
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          artists: [${
            artists
              ? artists.map(
                  (artist) => `{ displayName: "${artist.displayName}" }`
                )
              : null
          }],
          category: "some strange category"
          coaByAuthenticatingBody: false
          coaByGallery: true
          condition: VERY_GOOD
          conditionDescription: "like a new!"
          costCurrencyCode: "USD"
          costMinor: 200
          date: "1990"
          depth: "20"
          hasCertificateOfAuthenticity: true
          isEdition: ${JSON.stringify(isEdition)}
          isFramed: true,
          editionNumber: ${JSON.stringify(editionNumber)}
          editionSize: ${JSON.stringify(editionSize)}
          externalImageUrls: ${JSON.stringify(externalImageUrls)}
          framedMetric: "in",
          framedDepth: "1",
          framedHeight: "21",
          framedWidth: "21",
          height: "20"
          artworkLocation: "Berlin, Germany"
          collectorLocation: {country: "Germany", city: "Berlin"}
          medium: "Painting"
          metric: "in"
          pricePaidCents: 10000
          pricePaidCurrency: "USD"
          provenance: "Pat Hearn Gallery"
          signatureDetails: "artist initials"
          signatureTypes: [OTHER]
          title: "hey now"
          width: "20"
          importSource: CONVECTION
        }
      ) {
        artworkOrError {
          ... on MyCollectionArtworkMutationSuccess {
            artwork {
              additionalInformation
              medium
              artworkLocation
              certificateOfAuthenticityDetails {
                coaByAuthenticatingBody
                coaByGallery
              }
              collectorLocation {
                city
                country
              }
              condition {
                value
                displayText
                description
              }
              conditionDescription {
                label
                details
              }
              pricePaid {
                display
              }
              hasCertificateOfAuthenticity
              images(includeAll: true) {
                imageURL
              }
              signature
              signatureInfo {
                details
                label
              }
              isFramed
              framedMetric
              framedDepth
              framedHeight
              framedWidth
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
  artworkLoader,
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

      expect(artworkOrError).toMatchInlineSnapshot(`
        {
          "artwork": {
            "additionalInformation": "additional info",
            "artworkLocation": "Berlin, Germany",
            "certificateOfAuthenticityDetails": {
              "coaByAuthenticatingBody": false,
              "coaByGallery": true,
            },
            "collectorLocation": {
              "city": "Berlin",
              "country": "Germany",
            },
            "condition": {
              "description": "Like a new!",
              "displayText": "Very good",
              "value": "VERY_GOOD",
            },
            "conditionDescription": {
              "details": "Like a new!",
              "label": "Condition details",
            },
            "framedDepth": "1",
            "framedHeight": "21",
            "framedMetric": "in",
            "framedWidth": "21",
            "hasCertificateOfAuthenticity": true,
            "images": [
              {
                "imageURL": null,
              },
            ],
            "isFramed": true,
            "medium": "Painting",
            "pricePaid": {
              "display": "$100",
            },
            "signature": "artist initials",
            "signatureInfo": {
              "details": "Artist initials",
              "label": "Signature",
            },
          },
          "artworkEdge": {
            "node": {
              "attributionClass": {
                "name": "Open edition",
              },
              "medium": "Painting",
            },
          },
        }
      `)
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
        additional_information: "additional info",
        artists: [
          "4d8b92b34eb68a1b2c0003f4",
          "some-artist-id",
          "some-artist-id",
        ],
        artwork_location: "Berlin, Germany",
        attribution_class: undefined,
        category: "some strange category",
        certificate_of_authenticity: true,
        coa_by_authenticating_body: false,
        coa_by_gallery: true,
        collection_id: "my-collection",
        collector_location: { city: "Berlin", country: "Germany" },
        condition: "very_good",
        condition_description: "like a new!",
        confidential_notes: undefined,
        cost_currency_code: "USD",
        cost_minor: 200,
        date: "1990",
        depth: "20",
        framed: true,
        framed_depth: "1",
        framed_height: "21",
        framed_metric: "in",
        framed_width: "21",
        height: "20",
        import_source: "convection",
        medium: "Painting",
        metric: "in",
        not_signed: false,
        price_paid_cents: 10000,
        price_paid_currency: "USD",
        provenance: "Pat Hearn Gallery",
        signature: "artist initials",
        signed_by_artist: false,
        signed_in_plate: false,
        signed_other: true,
        stamped_by_artist_estate: false,
        sticker_label: false,
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

      expect(artworkOrError).toMatchInlineSnapshot(`
        {
          "artwork": {
            "additionalInformation": "additional info",
            "artworkLocation": "Berlin, Germany",
            "certificateOfAuthenticityDetails": {
              "coaByAuthenticatingBody": false,
              "coaByGallery": true,
            },
            "collectorLocation": {
              "city": "Berlin",
              "country": "Germany",
            },
            "condition": {
              "description": "Like a new!",
              "displayText": "Very good",
              "value": "VERY_GOOD",
            },
            "conditionDescription": {
              "details": "Like a new!",
              "label": "Condition details",
            },
            "framedDepth": "1",
            "framedHeight": "21",
            "framedMetric": "in",
            "framedWidth": "21",
            "hasCertificateOfAuthenticity": true,
            "images": [
              {
                "imageURL": null,
              },
            ],
            "isFramed": true,
            "medium": "Painting",
            "pricePaid": {
              "display": "$100",
            },
            "signature": "artist initials",
            "signatureInfo": {
              "details": "Artist initials",
              "label": "Signature",
            },
          },
          "artworkEdge": {
            "node": {
              "attributionClass": {
                "name": "Open edition",
              },
              "medium": "Painting",
            },
          },
        }
      `)
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(newArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })
    })

    it("creates an additional image from a valid remote image url", async () => {
      const externalImageUrls = [
        "https://d2v80f5yrouhh2.cloudfront.net/kKRlZGUZU6qHYbsHWV_0ig/large.jpg",
      ]
      const mutation = computeMutationInput({ externalImageUrls })

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(newArtwork.id, {
        remote_image_url:
          "https://d2v80f5yrouhh2.cloudfront.net/kKRlZGUZU6qHYbsHWV_0ig/large.jpg",
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

  it("filters out urls that don't match the regex and are not valid urls", () => {
    const externalImageUrls = ["example.com/path/to/image.jpg"]
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
    expect(imageSources.length).toEqual(2)
  })

  describe("API backwords compatibility with the price paid", () => {
    it("returns the price paid in cents as it is when no major cost is specified", () => {
      expect(
        transformToPricePaidCents({
          costMajor: undefined,
          costMinor: undefined,
          pricePaidCents: 1234500,
        })
      ).toEqual(1234500)
    })
    it("returns the price paid in cents computed from the costMajor and costMinor when a costMajor is specified", () => {
      expect(
        transformToPricePaidCents({
          costMajor: 12345,
          costMinor: undefined,
          pricePaidCents: 1234500,
        })
      ).toEqual(1234500)

      expect(
        transformToPricePaidCents({
          costMajor: 12345,
          costMinor: 0,
          pricePaidCents: 1234500,
        })
      ).toEqual(1234500)

      expect(
        transformToPricePaidCents({
          costMajor: 12345,
          costMinor: 1,
          pricePaidCents: 1234500,
        })
      ).toEqual(1234501)

      expect(
        transformToPricePaidCents({
          costMajor: 12345,
          costMinor: undefined,
          pricePaidCents: undefined,
        })
      ).toEqual(1234500)
    })
  })
})
