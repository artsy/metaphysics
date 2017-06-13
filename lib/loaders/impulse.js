import { toKey } from "lib/helpers"
import impulse from "lib/apis/impulse"
import authenticatedHttpLoader from "./authenticated_http"

const load = {}

load.with = (accessToken, loaderOptions = {}) => {
  const authenticatedImpulseLoader = authenticatedHttpLoader(impulse, accessToken, loaderOptions)
  return (path, options = {}) => {
    const key = toKey(path, options)
    return authenticatedImpulseLoader(key, accessToken)
  }
}

export default load
