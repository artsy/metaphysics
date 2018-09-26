import urljoin from "url-join"
import fetch from "./fetch"
import config from "config"

const { GEMINI_API_BASE } = config
export default (path, params) => fetch(urljoin(GEMINI_API_BASE, path), params)
