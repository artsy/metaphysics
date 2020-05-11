import { Union, Static } from "runtypes"
import { FeaturedLink } from "./FeaturedLink"
import { Sale } from "./Sale"
import { Artist } from "./Artist"
import { Artwork } from "./Artwork"

// TODO: Gene
// TODO: OrderedSet
// TODO: PartnerShow
// TODO: Profile
// TODO: User
export const OrderedItem = Union(Artist, Artwork, FeaturedLink, Sale)

export type OrderedItem = Static<typeof OrderedItem>
