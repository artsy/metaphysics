import factories from "../api"

export const convectionLoaders = (opts) => {
  const { convectionLoaderWithoutAuthenticationFactory } = factories(opts)
  const convectionLoader = convectionLoaderWithoutAuthenticationFactory

  return {
    createConsignmentInquiryLoader: convectionLoader(
      "consignment_inquiries",
      {},
      { method: "POST" }
    ),
  }
}
