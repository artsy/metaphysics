import { URLSearchParams } from "url"
import { ConnectionCursor } from "graphql-relay"
import qs from "qs"
import { unBase64, base64 } from "lib/base64"

type OffsetState<T extends string> = Record<T, number> & {
  // this is kind of strange; the _position attr is the overall
  // (0-based) index in the collection. It starts out null
  _position: number | null
}

const PREFIX = "offsets"

// increment a number input or `null` to 0
const incrementFromNull = (x: number | null): number => (x === null ? 0 : x + 1)

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
        throw new Error(
          `Hybrid offsets deserialization failed on ${key} - ${offsetsString}`
        )
      }
      return { ...acc, [key]: value }
    }, {} as OffsetState<U>)

    const result = new HybridOffsets<U>(offsets)
    return result
  }

  private constructor(offsets: OffsetState<T>) {
    this.state = offsets
  }

  /**
   * Increment the offsets, returning a new object with
   * supplied `key` arg + overall position updated
   */
  increment(key: T) {
    const { [key]: current, _position: currentPosition } = this.state

    const newOffsets = {
      ...this.state,
      [key]: current + 1,
      _position: incrementFromNull(currentPosition),
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
