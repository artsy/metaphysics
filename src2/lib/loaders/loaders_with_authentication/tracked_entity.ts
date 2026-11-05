import DataLoader from "dataloader"
import { map, find, extend } from "lodash"

export interface TrackedEntityLoaderFactoryOptions {
  /**
   * The key that’s to be used for the list of IDs param that’s sent with the API request
   */
  paramKey: string
  /**
   * The key that’s to be used for this entity, e.g. `is_followed` or `is_saved`.
   */
  trackingKey: string
  /**
   * An optional path to a nested entity
   */
  entityKeyPath?: string
  /**
   * An optional path to the IDs used to compare entities (defaults to `id`, but `_id` is sometimes useful).
   */
  entityIDKeyPath?: string
  /**
   * The maximum number of requests to batch in a single request (defaults to 200).
   */
  batchSize?: number
}

/**
 * Produces a loader that checks if an entity is followed/saved and does so by batching API requests. The endpoint needs
 * to accept an `ids` param for this to work.
 *
 * @param {*} dataLoader a configured (with path and default params) data loader that will make the actual API request.
 * @param {TrackedEntityLoaderFactoryOptions} options configuration for the tracked entity loader.
 */
const trackedEntityLoaderFactory = (
  dataLoader: (id: any) => Promise<any>,
  options: TrackedEntityLoaderFactoryOptions
) => {
  const {
    paramKey,
    trackingKey,
    entityKeyPath,
    entityIDKeyPath = "id",
    batchSize = 200,
  } = options
  const trackedEntityLoader = new DataLoader(
    (ids) => {
      return dataLoader({ [paramKey]: ids }).then((body) => {
        const parsedResults = map(ids, (id) => {
          const match = find(body, [
            entityKeyPath
              ? `${entityKeyPath}.${entityIDKeyPath}`
              : entityIDKeyPath,
            id,
          ])
          if (match) {
            return extend(entityKeyPath ? match[entityKeyPath] : match, {
              [trackingKey]: true,
            })
          }
          return { id, [trackingKey]: false }
        })
        return parsedResults
      })
    },
    { batch: true, cache: true, maxBatchSize: batchSize }
  )
  return (id) => trackedEntityLoader.load(id)
}

export default trackedEntityLoaderFactory
