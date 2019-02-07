import DataLoader from "dataloader"
import { map, find, extend } from "lodash"

/**
 * Produces a loader that checks if an entity is followed/saved and does so by batching API requests. The endpoint needs
 * to accept an `ids` param for this to work.
 *
 * @param {*} dataLoader a configured (with path and default params) data loader that will make the actual API request
 * @param {string} paramKey the key that’s to be used for the list of IDs param that’s sent with the API request
 * @param {string} trackingKey the key that’s to be used for this entity, e.g. `is_followed` or `is_saved`.
 * @param {string} [entityKeyPath] an optional path to a nested entity
 * @param {string} [entityIDKeyPath] an optional path to the IDs used to compare entities (defaults to `id`, but `_id` is sometimes useful).
 */
const trackedEntityLoaderFactory = (
  dataLoader: (id: any) => Promise<any>,
  paramKey: string,
  trackingKey: string,
  entityKeyPath?: string,
  entityIDKeyPath: string = "id"
) => {
  const trackedEntityLoader = new DataLoader(
    ids => {
      return dataLoader({ [paramKey]: ids }).then(body => {
        const parsedResults = map(ids, id => {
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
    { batch: true, cache: true }
  )
  return id => trackedEntityLoader.load(id)
}

export default trackedEntityLoaderFactory
