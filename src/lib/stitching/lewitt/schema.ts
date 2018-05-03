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
    Currencies: "PartnerProductInvoiceCurrencies",
    Invoice: "PartnerProductInvoice",
    CreateInvoiceInput: "PartnerProductCreateInvoiceInput",
    ArtworkGroup: "PartnerProductInvoiceArtworkGroup",
    LineItem: "PartnerProductInvoiceLineItem",
    MerchantAccount: "PartnerProductInvoiceMerchantAccount",
    Json: "PartnerProductJson",
  }

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes(name => {
      const newName = remap[name]
      if (!newName) {
        throw new Error(
          `All types inside Lewitt should be mapped.\n Missing ${name}`
        )
      }
      return newName
    }),
  ])
}
