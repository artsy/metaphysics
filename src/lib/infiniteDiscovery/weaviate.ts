import uuid from "uuid/v5"
import gql from "../gql"
import { random, sampleSize } from "lodash"

interface UserResponse {
  data: {
    Get: {
      InfiniteDiscoveryUsers: WeaviateUser[]
    }
  }
}

interface ArtworkResponse {
  data: {
    Get: {
      InfiniteDiscoveryArtworks: { internalID: string }[]
    }
  }
}

interface WeaviateUser {
  _additional: { id: string }
  likedArtworks: { internalID: string }[]
  seenArtworks: { internalID: string }[]
}

interface UserCreationBody {
  class: string
  id: string
  properties: { internalID: string }
}

/**
 * Extracts the first user from the Weaviate response
 *
 * @param  response of the image to read
 * @returns the user object
 */
export function getUser(response: UserResponse): WeaviateUser | null {
  const responseArray = response?.data?.Get

  if (!responseArray) {
    return null
  }

  return responseArray.InfiniteDiscoveryUsers[0]
}

/**
 * Extracts the artwork internalIDs from the Weaviate response
 *
 * @param response from the Weaviate API containing InfiniteDiscoveryArtworks
 * @returns an array of the artwork internalIDs
 */
export function getArtworkIds(response: ArtworkResponse): string[] {
  const responseArray = response?.data?.Get

  if (!responseArray) {
    return []
  }

  return responseArray.InfiniteDiscoveryArtworks.map(
    (artwork) => artwork.internalID
  )
}

/**
 * Inserts a sample of curated artworks at random indexes into the target array
 *
 * @param target the array to insert the curated artworks into
 * @param curatedWorks the array of curated artworks from which to sample
 * @param sampleAmount the amount of curated artworks to insert
 * @returns a copy of the target array with the curated artworks inserted
 * */
export const insertSampleCuratedWorks = (
  target: string[],
  curatedWorks: string[],
  sampleAmount: number
): string[] => {
  const mixedArtworks = [...target]

  const curatedSample = sampleSize(curatedWorks, sampleAmount)

  curatedSample.forEach((challengeArtwork) => {
    const length = target.length
    const randomIndex = random(length)
    mixedArtworks.splice(randomIndex, 0, challengeArtwork)
  })

  return mixedArtworks
}

/**
 * Extracts the liked and seen artworks from a InfiniteDiscoveryUser object
 *
 * @param user a user object from Weaviate
 * @returns an array of the internalIDs of the liked and seen artworks
 */
export function getUserFilterList(user: WeaviateUser): string[] {
  const likedArtworkIds =
    user.likedArtworks?.map((node) => node.internalID) || []
  const seenArtworkIds = user.seenArtworks?.map((node) => node.internalID) || []
  return [...likedArtworkIds, ...seenArtworkIds]
}

/**
 * Filters a list of IDs based on a filter list
 *
 * @param list the list of IDs to filter
 * @param filterList the list of IDs to filter out
 * @returns a filtered list of IDs
 */
export function getFilteredIdList(
  list: string[],
  filterList: string[]
): string[] {
  return list.filter((id) => !filterList.includes(id))
}

/**
 * Generates a UUID based on the userId
 *
 * @param userId the internalID to generate the UUID from
 * @returns a UUID
 */
export const generateUuid = (userId: string) => {
  if (!userId) return ""
  return uuid(userId, uuid.DNS).toString()
}

/**
 * Generates a weaviate beacon based on the namespace and identifier
 *
 * @param collection the collection of the beacon
 * @param identifier the identifier of the beacon
 * @returns a beacon
 */
export function generateBeacon(collection: string, identifier: string): string {
  // TODO: Understand why localhost works here and weaviate://weaviate.stg.artsy.net doesn't
  return `weaviate://localhost/${collection}/${identifier}`
}

/**
 * Generates a weaviate graphql query to get a user by their internalID
 *
 * @param userId the internalID of the user
 * @returns a graphql query string
 */
export function getUserQuery(userId) {
  return gql`
    {
      Get {
        InfiniteDiscoveryUsers(
          where: { path: ["internalID"], operator: Equal, valueString: "${userId}" }
        ) {
          likedArtworks {
            ... on InfiniteDiscoveryArtworks {
              internalID
            }
          }
          seenArtworks  {
            ... on InfiniteDiscoveryArtworks {
              internalID
            }
          }
        }
      }
    }
  `
}

/**
 * Generates a weaviate graphql query to get artworks near a user using a
 * nearObject search query
 *
 * @param userId the internalID of the user
 * @param certainty the certainty of the recommendation
 * @param limit the number of artworks to return
 * @param offset the number of artworks to skip
 * @returns a graphql query string
 */
export function getNearObjectQuery(
  userId: string,
  {
    certainty,
    limit,
    offset,
  }: { certainty: number; limit: number; offset: number }
): string {
  const userUUID = generateUuid(userId)
  const beacon = generateBeacon("InfiniteDiscoveryUsers", userUUID)
  return gql`
    {
      Get {
        InfiniteDiscoveryArtworks(
            nearObject: {
              beacon: "${beacon}",
              certainty: ${certainty}
            },
            limit: ${limit},
            offset: ${offset},
        ) {
          internalID
          _additional {
            id
          }
        }
      }
    }
  `
}

/**
 * Generates a weaviate graphql query to get curated artworks from the InfiniteDiscoveryArtworks class
 *
 * @returns a graphql query string
 */
export function getCuratedArtworksQuery(): string {
  return gql`
    {
      Get {
        InfiniteDiscoveryArtworks(
          limit: 200
          where: { path: ["isCurated"], operator: Equal, valueBoolean: true }
        ) {
          internalID
          _additional {
            id
          }
        }
      }
    }
  `
}

/**
 * Generates a request body for the Weaviate REST API to create a user
 *
 * @param userId the internalID of the user
 * @returns a request body for the Weaviate REST API
 */
export function getUserCreationBody(userId: string): UserCreationBody {
  const userUUID = generateUuid(userId)
  return {
    class: "InfiniteDiscoveryUsers",
    id: userUUID,
    properties: {
      internalID: userId,
    },
  }
}
