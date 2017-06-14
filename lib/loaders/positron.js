import { toKey } from "lib/helpers"
import positron from "lib/apis/positron"
import httpLoader from "./http"

export const positronLoader = httpLoader(positron)

export default (path, options = {}) => positronLoader.load(toKey(path, options))
