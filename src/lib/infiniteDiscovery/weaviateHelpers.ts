import uuid from "uuid/v5"
import gql from "../gql"
import { random } from "lodash"

// get weaviate response object
export function getUser(response) {
  const responseArray = response?.data?.Get

  if (!responseArray) {
    return null
  }

  return responseArray.InfiniteDiscoveryUsers[0]
}

export function GetArtworkIds(response): string[] {
  const responseArray = response?.data?.Get

  if (!responseArray) {
    return []
  }

  return responseArray.InfiniteDiscoveryArtworks.map(
    (artwork) => artwork.internalID
  )
}

export const insertSampleCuratedWorks = (target, curatedWorks, sampleSize) => {
  const mixedArtworks = [...target]

  const curatedSample = sampleSize(curatedWorks, sampleSize)

  curatedSample.forEach((challengeArtwork) => {
    const length = target.length
    const randomIndex = random(length)
    mixedArtworks.splice(randomIndex, 0, challengeArtwork)
  })

  return mixedArtworks
}

export function getUserFilterList(user) {
  const likedArtworkIds =
    user.likedArtworks?.map((node) => node.internalID) || []
  const seenArtworkIds = user.seenArtworks?.map((node) => node.internalID) || []
  return [...likedArtworkIds, ...seenArtworkIds]
}

export const generateUuid = (userId: string) => {
  if (!userId) return ""
  return uuid(userId, uuid.DNS).toString()
}

export function generateBeacon(namespace: string, identifier: string) {
  // TODO: Understand why localhost works here and weaviate://weaviate.stg.artsy.net doesn't
  return `weaviate://localhost/${namespace}/${identifier}`
}

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

export function getNearObjectQuery(userId, { certainty, limit, offset }) {
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

export function getCuratedArtworksQuery() {
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

export function getUserCreationBody(userId) {
  const userUUID = generateUuid(userId)
  return {
    class: "InfiniteDiscoveryUsers",
    id: userUUID,
    properties: {
      internalID: userId,
    },
  }
}

export function getFilteredIdList(list, filterList) {
  return list.filter((id) => !filterList.includes(id))
}
