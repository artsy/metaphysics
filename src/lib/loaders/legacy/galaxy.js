import { toKey } from "lib/helpers"
import galaxy from "lib/apis/galaxy"
import httpLoader from "./http"

export const galaxyLoader = httpLoader(galaxy)

export default (path, options = {}) => galaxyLoader.load(toKey(path, options))
