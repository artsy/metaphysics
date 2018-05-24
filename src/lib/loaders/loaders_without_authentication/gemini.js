// @ts-check

import gemini from "../../apis/gemini"
import { unescape } from "querystring"

import { loaderOneOffFactory } from "../api/loader_one_off_factory"

const toBase64 = string =>
  new Buffer(unescape(encodeURIComponent(string)), "binary").toString("base64")

export default () => ({
  // The outer function is so that we can pass params from the schema,
  // into the gemini api.
  createNewGeminiAssetLoader: ({ name, acl }) =>
    loaderOneOffFactory(gemini, "gemini", `uploads/new.json?acl=${acl}`, {
      acl,
      headers: {
        Authorization: `Basic ${toBase64(`${name}:`)}`,
      },
    }),

  createNewGeminiEntryAssetLoader: ({
    template_key,
    source_key,
    source_bucket,
    metadata,
  }) =>
    loaderOneOffFactory(gemini, "gemini", "entries.json", {
      method: "POST",
      form: {
        entry: {
          template_key,
          source_key,
          source_bucket,
          metadata,
        },
      },
      headers: {
        Authorization: `Basic ${toBase64(`${template_key}:`)}`,
      },
    }),
})
