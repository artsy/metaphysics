import { createLewittLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableLewittSchema = async () => {
  const lewittSDL = readFileSync("src/data/lewitt.graphql", "utf8")
  const lewittLink = createLewittLink()

  const schema = await makeRemoteExecutableSchema({
    schema: lewittSDL,
    link: lewittLink,
  })

  // Remap the names of certain types from Lewitt to fit in the larger
  // metaphysics ecosystem.
  const remap = {
    Currencies: "PartnerInvoiceCurrencies",
    Invoice: "PartnerInvoice",
    ArtworkGroup: "PartnerInvoiceArtworkGroup",
    LineItem: "PartnerInvoiceLineItem",
    MerchantAccount: "PartnerMerchantAccount",
  }

  // TODO: Rename the mutation `create_invoice`?

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes(name => {
      const newName = remap[name] || name
      return newName
    }),
  ])
}
