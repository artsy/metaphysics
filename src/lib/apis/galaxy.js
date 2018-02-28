// @ts-check
import fetch from "./fetch"
import config from "config"

const { GALAXY_API_BASE, GALAXY_TOKEN } = config

export default path => {
  const headers = {
    Accept: "application/vnd.galaxy-public+json",
    "Content-Type": "application/hal+json",
    "Http-Authorization": GALAXY_TOKEN,
  }
  return fetch(`${GALAXY_API_BASE}/${path}`, { headers })
}
