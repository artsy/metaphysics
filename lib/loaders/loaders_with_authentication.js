import { gravityLoaderWithAuthentication } from "./apis"
const { IMPULSE_APPLICATION_ID } = process.env

export default accessToken => {
  const gravityLoader = gravityLoaderWithAuthentication(accessToken)
  return {
    impulseTokenLoader: gravityLoader(
      "me/token",
      { method: "POST" },
      { client_application_id: IMPULSE_APPLICATION_ID }
    ),
  }
}
