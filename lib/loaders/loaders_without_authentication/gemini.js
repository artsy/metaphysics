// @ts-check

import gemini from "../../apis/gemini"
import DataLoader from "dataloader"
import { loaderInterface } from "../api/loader_interface"

const toBase64 = string => new Buffer(unescape(encodeURIComponent(string)), "binary").toString("base64")

// As this API is write-only there's no need to do the full DataLoader bidings
// This will run through DataLoader for API consistency but will not handle caching.
const geminiLoader = (path, options) =>
  loaderInterface(new DataLoader(() => Promise.resolve([gemini(path, options).then(r => r.body)])), { cache: false })(
    options
  )

export default {
  // The outer function is so that we can pass params from the schema,
  // into the gemini api.
  createNewUploadLoader: ({ name, acl }) => {
    return geminiLoader(`uploads/new.json?acl=${acl}`, {
      acl,
      headers: {
        Authorization: "Basic " + toBase64(name + ":"),
      },
    })
  },
}
