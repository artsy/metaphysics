import { graphqlUploadExpress } from "graphql-upload"
import config from "../config"

const {
  PRODUCTION_ENV,
  GRAPHQL_UPLOAD_MAX_FILES,
  GRAPHQL_UPLOAD_MAX_FILE_SIZE_IN_BYTES,
} = config

export const graphqlUploadMiddleware = (req, res, next) => {
  const accessToken = req.headers["x-access-token"] as string | undefined

  if (PRODUCTION_ENV && req.is("multipart/form-data")) {
    throw new Error("You cannot upload file for production")
  }

  // Only available for logged in users and non-production env
  if (!PRODUCTION_ENV && accessToken) {
    const graphqlUpload = graphqlUploadExpress({
      maxFileSize: GRAPHQL_UPLOAD_MAX_FILE_SIZE_IN_BYTES,
      maxFiles: GRAPHQL_UPLOAD_MAX_FILES,
    })

    return graphqlUpload(req, res, next)
  }

  return next()
}
