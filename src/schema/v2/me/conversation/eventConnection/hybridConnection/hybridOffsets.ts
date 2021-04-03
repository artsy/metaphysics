import { ConnectionCursor } from "graphql-relay"
import qs from "qs"
import { URLSearchParams } from "url"

type OffsetState<T extends string> = { _position: number | null } & Record<
  T,
  number
>

const PREFIX = "offsets"

// cursor serializers
const base64 = (str: string) => Buffer.from(str, "utf-8").toString("base64")
const unBase64 = (str: string) => Buffer.from(str, "base64").toString("utf-8")

export class HybridOffsets<T extends string> {
  readonly state: OffsetState<T>

  /**
   * create an empty HybridOffsets with the supplied source keys plus `position`.
   * Each offset key is initialized to 0, while `position` is a 0-indexed counter
   * of the entire collection and thus starts at `null`, then 0, 1, etc.
   */
  static empty<U extends string>(keys: Array<U>): HybridOffsets<U> {
    const offsets = keys.reduce<OffsetState<U>>(
      (acc: OffsetState<U>, key: U) => {
        return { ...acc, [key]: 0 }
      },
      { _position: null } as OffsetState<U>
    )
    return new HybridOffsets(offsets)
  }

  static decode<U extends string>(cursor: ConnectionCursor): HybridOffsets<U> {
    const [type, offsetsString] = unBase64(cursor).split(":")
    if (type !== PREFIX) {
      throw new Error(`Unexpected serialized cursor type: ${type}`)
    }
    const rawOffsets = qs.parse(offsetsString)
    const offsets = Object.entries(rawOffsets).reduce((acc, keyVal) => {
      const [key, valueString] = keyVal
      const value = valueString === "null" ? null : Number(valueString)

      if (value !== null && isNaN(value)) {
        throw new Error("Deserialization error")
      }
      return { ...acc, [key]: value }
    }, {} as OffsetState<U>)
    return new HybridOffsets<U>(offsets)
  }

  private constructor(offsets: OffsetState<T>) {
    this.state = offsets
  }

  /**
   * Increment the offsets, returning a new object with
   * supplied `key` arg updated - because `position` is
   * (0-indexed, so currently null values increment to 0)
   */
  increment(key: T) {
    const current: number | null = this.state[key]
    const currentPosition: number | null = this.position

    const newOffsets = {
      ...this.state,
      [key]: current === null ? 0 : current + 1,
      _position: currentPosition === null ? 0 : currentPosition + 1,
    }
    return new HybridOffsets<T>(newOffsets)
  }

  get position() {
    return this.state._position
  }

  get serialized() {
    return new URLSearchParams(this.state as any).toString()
  }

  get encoded(): ConnectionCursor {
    return base64(PREFIX + ":" + this.serialized)
  }
}
