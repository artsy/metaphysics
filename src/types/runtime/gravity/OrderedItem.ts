import { Union, Static } from "runtypes"
import { Artist } from "./Artist"
import { Artwork } from "./Artwork"
import { FeaturedLink } from "./FeaturedLink"
import { Gene } from "./Gene"
import { OrderedSet } from "./OrderedSet"
import { PartnerShow } from "./PartnerShow"
import { Profile } from "./Profile"
import { Sale } from "./Sale"
import { User } from "./User"
import { Video } from "./Video"

export const OrderedItem = Union(
  Artist,
  Artwork,
  FeaturedLink,
  Gene,
  OrderedSet,
  PartnerShow,
  Profile,
  Sale,
  User,
  Video
)

export type OrderedItem = Static<typeof OrderedItem>
