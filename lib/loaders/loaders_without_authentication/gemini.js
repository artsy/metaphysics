// @ts-check

import gemini from "../../apis/gemini"
import { unescape } from "querystring"

import { loaderOneOffFactory } from "../api/loader_one_off_factory"

const toBase64 = string => new Buffer(unescape(encodeURIComponent(string)), "binary").toString("base64")

export default {
  // The outer function is so that we can pass params from the schema,
  // into the gemini api.
  createNewGeminiAssetLoader: ({ name, acl }) =>
    loaderOneOffFactory(gemini, `uploads/new.json?acl=${acl}`, {
      acl,
      headers: {
        Authorization: "Basic " + toBase64(name + ":"),
      },
    }),
}
