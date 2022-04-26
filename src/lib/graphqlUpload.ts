import { graphqlUploadExpress } from "graphql-upload"
import { RequestHandler } from "express"
import config from "../config"

const {
  ENABLE_GRAPHQL_UPLOAD,
  GRAPHQL_UPLOAD_MAX_FILES,
  GRAPHQL_UPLOAD_MAX_FILE_SIZE_IN_BYTES,
} = config

export const graphqlUploadMiddleware: RequestHandler = (req, res, next) => {
  if (!ENABLE_GRAPHQL_UPLOAD && req.is("multipart/form-data")) {
    throw new Error("You cannot perform this action")
  }

  if (ENABLE_GRAPHQL_UPLOAD) {
    const graphqlUpload = graphqlUploadExpress({
      maxFileSize: GRAPHQL_UPLOAD_MAX_FILE_SIZE_IN_BYTES,
      maxFiles: GRAPHQL_UPLOAD_MAX_FILES,
    })

    return graphqlUpload(req, res, next)
  }

  return next()
}
