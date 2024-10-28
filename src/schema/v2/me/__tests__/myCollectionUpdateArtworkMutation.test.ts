import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const updatedArtwork = { id: "some-artwork-id" }
const updateArtworkLoader = jest.fn().mockResolvedValue(updatedArtwork)

const defaultArtworkDetails = ({
  externalImageUrls = [],
  editionSize = null,
  editionNumber = null,
  isEdition = null,
}: {
  externalImageUrls?: string[]
  editionSize?: string | null
  editionNumber?: string | null
  isEdition?: boolean | null
} = {}) => ({
  additional_information: "some additional info",
  id: "some-artwork-id",
  artistIds: ["4d8b92b34eb68a1b2c0003f4"],
  artworkId: "some-artwork-id",
  category: "some strange category",
  certificate_of_authenticity: true,
  coa_by_authenticating_body: false,
  coa_by_gallery: true,
  images: [
    {
      imageUrl: "an-image-url",
    },
  ],
  date: "1990",
  depth: "20",
  is_edition: JSON.stringify(isEdition),
  edition_number: JSON.stringify(editionNumber),
  edition_size: JSON.stringify(editionSize),
  external_image_urls: JSON.stringify(externalImageUrls),
  framed: true,
  framed_depth: "1",
  framed_height: "21",
  framed_metric: "in",
  framed_width: "21",
  height: "20",
  medium: "Updated",
  metric: "in",
  price_paid_cents: 10000,
  price_paid_currency: "USD",
  artwork_location: "Berlin, Germany",
  collector_location: { city: "Berlin", country: "Germany" },
  condition: "very_good",
  condition_description: "like a new!",
  provenance: "Pat Hearn Gallery",
  title: "hey now",
  width: "20",
  attribution_class: "open edition",
  signature: "artist initials",
  signed_other: true,
  submissionId: "submission-id",
})

const artworkLoader = jest.fn().mockResolvedValue(defaultArtworkDetails())

const createImageLoader = jest.fn().mockResolvedValue({
  id: "63c6ad60d58c97000d3fb1a7",
  position: 1,
  aspect_ratio: null,
  image_url: null,
})

const computeMutationInput = ({
  externalImageUrls = [],
  editionSize = null,
  editionNumber = null,
  isEdition = null,
}: {
  externalImageUrls?: string[]
  editionSize?: string | null
  editionNumber?: string | null
  isEdition?: boolean | null
} = {}): string => {
  const mutation = gql`
    mutation {
      myCollectionUpdateArtwork(
        input: {
          additionalInformation: "some additional info"
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          artworkId: "some-artwork-id"
          category: "some strange category"
          coaByAuthenticatingBody: false
          coaByGallery: true
          date: "1990"
          depth: "20"
          hasCertificateOfAuthenticity: true
          isEdition: ${JSON.stringify(isEdition)}
          isFramed: true
          framedDepth: "1"
          framedHeight: "21"
          framedMetric: "in"
          framedWidth: "21"
          editionNumber: ${JSON.stringify(editionNumber)}
          editionSize: ${JSON.stringify(editionSize)}
          externalImageUrls: ${JSON.stringify(externalImageUrls)}
          height: "20"
          medium: "Updated"
          metric: "in"
          artworkLocation: "Berlin, Germany"
          collectorLocation: {country: "Germany", city: "Berlin"}
          condition: VERY_GOOD
          conditionDescription: "like a new!"
          pricePaidCents: 10000
          pricePaidCurrency: "USD"
          provenance: "Pat Hearn Gallery"
          signatureDetails: "artist initials"
          signatureTypes: [OTHER]
          title: "hey now"
          width: "20"
          submissionId: "submission-id"
        }
      ) {
        artworkOrError {
          ... on MyCollectionArtworkMutationSuccess {
            artwork {
              additionalInformation
              category
              certificateOfAuthenticityDetails {
                coaByAuthenticatingBody
                coaByGallery
              }
              date
              depth
              hasCertificateOfAuthenticity
              isEdition
              editionNumber
              editionSize
              height
              medium
              artworkLocation
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
              framedDepth
              framedHeight
              framedMetric
              framedWidth
              images(includeAll: true) {
                imageURL
              }
              isFramed
              metric
              provenance
              title
              width
              pricePaid {
                display
              }
              attributionClass{
                name
              }
              signature
              signatureInfo {
                details
                label
              }
            }
            artworkEdge {
              node {
                medium
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
const updateArtworkEditionSetLoader = jest.fn()
const deleteArtworkEditionSetLoader = jest.fn()

const defaultContext = {
  updateArtworkLoader,
  artworkLoader: artworkLoader,
  createArtworkImageLoader: createImageLoader,
  createArtworkEditionSetLoader,
  deleteArtworkEditionSetLoader,
  updateArtworkEditionSetLoader,
}

describe("myCollectionUpdateArtworkMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when the server responds with an error", () => {
    it("returns an error", async () => {
      const mutation = computeMutationInput()

      const serverError = "Error updating artwork"
      const url =
        "https://stagingapi.artsy.net/api/v1/my_collection?id=some-artwork-id"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        updateArtworkLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionUpdateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })
  })

  describe("when the server response is successful", () => {
    it("returns details of the new artwork", async () => {
      const mutation = computeMutationInput()

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionUpdateArtwork

      expect(artworkOrError).toMatchInlineSnapshot(`
        {
          "artwork": {
            "additionalInformation": "some additional info",
            "artworkLocation": "Berlin, Germany",
            "attributionClass": {
              "name": "Open edition",
            },
            "category": "some strange category",
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
            "date": "1990",
            "depth": "20",
            "editionNumber": null,
            "editionSize": null,
            "framedDepth": "1",
            "framedHeight": "21",
            "framedMetric": "in",
            "framedWidth": "21",
            "hasCertificateOfAuthenticity": true,
            "height": "20",
            "images": [
              {
                "imageURL": null,
              },
            ],
            "isEdition": null,
            "isFramed": true,
            "medium": "Updated",
            "metric": "in",
            "pricePaid": {
              "display": "$100",
            },
            "provenance": "Pat Hearn Gallery",
            "signature": "artist initials",
            "signatureInfo": {
              "details": "Artist initials",
              "label": "Signature",
            },
            "title": "hey now",
            "width": "20",
          },
          "artworkEdge": {
            "node": {
              "medium": "Updated",
            },
          },
        }
      `)
    })
  })

  describe("creating additional images", () => {
    it("creates an additional image with bucket and key with a valid image url", async () => {
      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput({ externalImageUrls })

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionUpdateArtwork

      expect(artworkOrError).toMatchInlineSnapshot(`
        {
          "artwork": {
            "additionalInformation": "some additional info",
            "artworkLocation": "Berlin, Germany",
            "attributionClass": {
              "name": "Open edition",
            },
            "category": "some strange category",
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
            "date": "1990",
            "depth": "20",
            "editionNumber": null,
            "editionSize": null,
            "framedDepth": "1",
            "framedHeight": "21",
            "framedMetric": "in",
            "framedWidth": "21",
            "hasCertificateOfAuthenticity": true,
            "height": "20",
            "images": [
              {
                "imageURL": null,
              },
            ],
            "isEdition": null,
            "isFramed": true,
            "medium": "Updated",
            "metric": "in",
            "pricePaid": {
              "display": "$100",
            },
            "provenance": "Pat Hearn Gallery",
            "signature": "artist initials",
            "signatureInfo": {
              "details": "Artist initials",
              "label": "Signature",
            },
            "title": "hey now",
            "width": "20",
          },
          "artworkEdge": {
            "node": {
              "medium": "Updated",
            },
          },
        }
      `)
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(updatedArtwork.id, {
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
      const { artworkOrError } = data.myCollectionUpdateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(updatedArtwork.id, {
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
      const { artworkOrError } = data.myCollectionUpdateArtwork
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
      expect(createImageLoader).toBeCalledWith(updatedArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })

      resolveCreateImageLoader()

      // flush promise queue
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(createImageLoader).toHaveBeenCalledTimes(2)
      expect(createImageLoader).toBeCalledWith(updatedArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/other/image.jpg",
      })
    })
  })

  describe("setting edition set info on an artwork with no edition set info", () => {
    it("creates an edition set on the artwork", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
        editionSize: "100",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        updatedArtwork.id,
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
        updatedArtwork.id,
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
        updatedArtwork.id,
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

    it("creates an edition set if you specify `isEdition` true", async () => {
      const mutation = computeMutationInput({
        isEdition: true,
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        updatedArtwork.id,
        {}
      )
    })
  })

  describe("setting edition set info on an artwork with existing edition set info", () => {
    const editionedArtwork = {
      ...updatedArtwork,

      edition_sets: [{ id: "my-edition-set-id" }],
    }
    beforeEach(() => {
      updateArtworkLoader.mockResolvedValueOnce(editionedArtwork)
    })

    it("updates the edition set on the artwork", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
        editionSize: "100",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
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

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
        {
          available_editions: ["50"],
          edition_size: null,
        }
      )
    })

    it("works if you only specify the edition size", async () => {
      const mutation = computeMutationInput({
        editionSize: "50",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
        {
          edition_size: "50",
          available_editions: [""],
        }
      )
    })

    it("removes existing edition set if you specify `isEdition` false", async () => {
      const mutation = computeMutationInput({
        isEdition: false,
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(deleteArtworkEditionSetLoader).toHaveBeenCalledWith({
        artworkId: updatedArtwork.id,
        editionSetId: editionedArtwork.edition_sets[0].id,
      })
    })

    it("resets the edition set if you don't specify either", async () => {
      const mutation = computeMutationInput({
        editionNumber: null,
        editionSize: null,
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
        {
          edition_size: null,
          available_editions: [""],
        }
      )
    })
  })
})
