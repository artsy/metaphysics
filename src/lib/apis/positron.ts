import urljoin from "url-join"
import fetch from "./fetch"
import config from "config"

const { POSITRON_API_BASE } = config

export default (path) => fetch(urljoin(POSITRON_API_BASE, path))
