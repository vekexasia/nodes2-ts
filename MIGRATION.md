# Migration Guide: nodes2-ts v3 → v4

## Why the change?

In v4, the `long` npm package has been removed in favour of native JavaScript
`bigint`. This eliminates a runtime dependency, improves performance (native
CPU 64-bit arithmetic), and makes the API more idiomatic in modern JS/TS.

---

## Breaking changes

### `S2CellId.id` — `Long` → `bigint`

```ts
// v3
const id: Long = cellId.id;
id.toString(); // signed decimal, e.g. "-6533045114107854848"

// v4
const id: bigint = cellId.id;
id.toString(); // unsigned decimal, e.g. "11913698959601696768"
```

### `S2CellId` constructor — `Long | string` → `bigint | string | number`

```ts
// v3
new S2CellId(Long.fromString('-6533045114107854848'))

// v4 – signed/unsigned strings, bigint, and number all work
new S2CellId('-6533045114107854848')   // signed string still accepted
new S2CellId('11913698959601696768')   // unsigned string
new S2CellId(11913698959601696768n)    // bigint literal
new S2CellId(42)                       // number (for small/safe integers)
```

> **⚠️ Precision:** Numbers beyond `Number.MAX_SAFE_INTEGER` (2^53 − 1) may
> silently lose precision before reaching the constructor. Prefer `bigint`
> literals (e.g. `11913698959601696768n`) for values above 2^53.

### `S2CellId.fromFacePosLevel` — `pos: Long` → `pos: bigint`

```ts
// v3
S2CellId.fromFacePosLevel(face, Long.fromNumber(pos), level)

// v4
S2CellId.fromFacePosLevel(face, BigInt(pos), level)
S2CellId.fromFacePosLevel(face, 0n, level)
```

### `S2CellId.pos()` — returns `bigint` (was `Long`)

```ts
// v3  cell.pos().toString()  → signed decimal
// v4  cell.pos().toString()  → unsigned decimal (same value, different string)
```

### `S2CellId.lowestOnBit()` / `lowestOnBitForLevel()` — return `bigint`

### `S2CellId.toIJOrientation()` — returns `bigint`

### `S2CellId.unsignedLongLessThan/greaterThan` — params now `bigint`

These are now trivial (`<` / `>`) since bigint is always unsigned-positive.

### `S2CellUnion.initFromIds()` / `initRawIds()` — `Long[] | string[]` → `bigint[] | string[] | number[]`

```ts
// v3
union.initFromIds(ids.map(c => c.id));  // c.id was Long

// v4
union.initFromIds(ids.map(c => c.id));  // c.id is now bigint — same call!
```

### `S2CellUnion.leafCellsCovered()` — returns `bigint` (was `Long`)

```ts
// v3
const n: Long = union.leafCellsCovered();
const area = n.mul(avgArea).toNumber();

// v4
const n: bigint = union.leafCellsCovered();
const area = Number(n) * avgArea;
```

---

## Operator cheat-sheet (Long → bigint)

| Long method | bigint equivalent |
|---|---|
| `a.add(b)` | `a + b` (use `u64(a+b)` if overflow possible) |
| `a.sub(b)` / `a.subtract(b)` | `a - b` (use `u64(a-b)` if underflow possible) |
| `a.mul(b)` | `a * b` |
| `a.and(b)` | `a & b` |
| `a.or(b)` | `a \| b` |
| `a.xor(b)` | `a ^ b` |
| `a.not()` | `u64(~a)` |
| `a.negate()` | `u64(-a)` |
| `a.shiftLeft(n)` | `u64(a << BigInt(n))` |
| `a.shiftRight(n)` | `a >> BigInt(n)` |
| `a.shiftRightUnsigned(n)` | `a >> BigInt(n)` (id is always ≥ 0) |
| `a.equals(b)` | `a === b` |
| `a.notEquals(b)` | `a !== b` |
| `a.lessThan(b)` | `a < b` |
| `a.greaterThan(b)` | `a > b` |
| `a.toNumber()` | `Number(a)` |
| `a.getLowBits()` | `Number(BigInt.asIntN(32, a))` |
| `a.getLowBitsUnsigned()` | `Number(a & 0xFFFFFFFFn)` |
| `a.toString(16)` | `a.toString(16)` |
| `a.toUnsigned()` | no-op (already unsigned) |
| `new Long(n)` / `Long.fromInt(n)` | `BigInt(n)` |
| `Long.fromString(s, true, 16)` | `BigInt('0x' + s)` (hex strings are always non-negative) |
| `Long.fromString(s, true, 10)` | `signedDecimalToUnsigned(s)` or `BigInt.asUintN(64, BigInt(s))` |

The `u64` helper is exported from `nodes2ts`:

```ts
import { u64 } from 'nodes2ts';
u64(-someId)  // two's-complement negation masked to 64 bits
```

---

## Handling signed-decimal IDs from databases / Java APIs

Java's `Long.toString()` produces **signed** decimal strings (e.g. `"-6533045114107854848"`).
The v4 constructor accepts these transparently:

> **⚠️ Warning:** `BigInt('-6533045114107854848')` produces a *negative* bigint (-6533045114107854848n),
> not the unsigned equivalent. Always use the `S2CellId` constructor, `signedDecimalToUnsigned()`,
> or `BigInt.asUintN(64, BigInt(s))` to obtain the correct unsigned 64-bit value.

```ts
// Works in v4 — signed string is reinterpreted as unsigned
const cell = new S2CellId('-6533045114107854848');
cell.id.toString(); // "11913698959601696768"  (unsigned)
```

To round-trip back to the signed format use the compat helpers:

```ts
import { unsignedToSignedDecimal, signedDecimalToUnsigned } from 'nodes2ts';

// unsigned → signed
unsignedToSignedDecimal(cell.id); // "-6533045114107854848"

// signed → unsigned
signedDecimalToUnsigned('-6533045114107854848'); // 11913698959601696768n

// or use the instance helper
cell.toSignedDecimalString(); // "-6533045114107854848"
```

Convenience: convert signed decimal → token in one call:

```ts
import { signedDecimalTokenMap } from 'nodes2ts';
signedDecimalTokenMap('-6533045114107854848'); // "a555f6151"
```

---

## Complete example

```ts
// Before (v3)
import Long from 'long';
import { S2CellId } from 'nodes2ts';

const pos = Long.fromString('384483913533227008', true, 10);
const cell = S2CellId.fromFacePosLevel(5, pos, 16);
console.log(cell.id.toString()); // "-6533045114107854848"  (signed)

// After (v4) — no Long import needed
import { S2CellId } from 'nodes2ts';

const cell = S2CellId.fromFacePosLevel(5, 384483913533227008n, 16);
console.log(cell.id.toString()); // "11913698959601696768"  (unsigned)

// Or via a signed string (backward compatible):
const cell2 = new S2CellId('-6533045114107854848');
console.log(cell2.id.toString()); // "11913698959601696768"
console.log(cell2.toToken());     // "a555f6151"
```
