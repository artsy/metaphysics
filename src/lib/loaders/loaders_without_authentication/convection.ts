import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

const { GRAVITY_XAPP_TOKEN, CONVECTION_API_BASE } = config

export const convectionLoaders = (_opts) => {
  const createConsignmentInquiryLoader = async <T = unknown>(
    variables
  ): Promise<Record<string, T>> => {
    const body = JSON.stringify(variables)

    const response = await fetch(
      urljoin(CONVECTION_API_BASE, "consignment_inquiries"),
      {
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${GRAVITY_XAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )

    const json = await response.json()
    if (json.error) {
      throw new Error(JSON.stringify(json))
    }
    return Promise.resolve(json)
  }

  return {
    createConsignmentInquiryLoader,
  }
}
