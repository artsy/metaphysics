import { toKey } from "lib/helpers"
import delta from "lib/apis/delta"
import httpLoader from "./http"

export const deltaLoader = httpLoader(delta)

export default (path, options = {}) => deltaLoader.load(toKey(path, options))
