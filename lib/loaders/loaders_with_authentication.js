import { authenticatedGravityLoaderFactory } from "./apis"
const { IMPULSE_APPLICATION_ID } = process.env

export default accessToken => {
  const authenticatedGravityLoader = authenticatedGravityLoaderFactory(accessToken)
  return {
    impulseTokenLoader: authenticatedGravityLoader(
      "me/token",
      { method: "POST" },
      { client_application_id: IMPULSE_APPLICATION_ID }
    ),
  }
}
