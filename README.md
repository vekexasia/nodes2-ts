### Node S2 Geometry Typescript
<img src="https://github.com/vekexasia/nodes2-ts/actions/workflows/node.js.yml/badge.svg" />

<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/> <img 
src="https://img.shields.io/badge/vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white"/> <img 
src="https://img.shields.io/badge/eslint-3A33D1?style=for-the-badge&logo=eslint&logoColor=white"/> <img
src="https://img.shields.io/badge/runtime_deps-0-brightgreen?style=for-the-badge"/>


An extensive port of google's s2 geometry library written in TypeScript.

The library has **no runtime dependencies**. Cell IDs use native JavaScript `bigint` (v4+).

Npm package is `nodes2ts`.

> Requires **Node.js 20+**.

## Breaking Changes in v4

**`S2CellId.id` is now `bigint` (was `Long`).**

```typescript
// v3
import Long from 'long';
const id = new S2CellId(Long.fromString('-6533045114107854848'));
id.id.toString(); // "-6533045114107854848"  (signed)

// v4 — Long import removed, signed strings still work in constructor
const id = new S2CellId('-6533045114107854848');
id.id.toString(); // "11913698959601696768"  (unsigned)
id.toSignedDecimalString(); // "-6533045114107854848"  (compat helper)
```

**Other changed APIs:**

| Symbol | v3 type | v4 type |
|---|---|---|
| `S2CellId.id` | `Long` | `bigint` |
| `S2CellId` constructor | `Long \| string` | `bigint \| string` |
| `S2CellId.fromFacePosLevel` `pos` | `Long` | `bigint` |
| `S2CellId.pos()` | `Long` | `bigint` |
| `S2CellId.lowestOnBit()` | `Long` | `bigint` |
| `S2CellId.lowestOnBitForLevel()` | `Long` | `bigint` |
| `S2CellId.toIJOrientation()` | `Long` | `bigint` |
| `S2CellUnion.initFromIds()` | `Long[] \| string[]` | `bigint[] \| string[]` |
| `S2CellUnion.leafCellsCovered()` | `Long` | `bigint` |

See [MIGRATION.md](./MIGRATION.md) for a full migration guide and operator cheat-sheet.

#### Tests
This project is backed by 80+ 1-by-1 comparison tests between this implementation and the original one.

When implementing a not-yet-ported feature, please generate the needed tests by modifiying the java code within `java-test-creator` folder

### Currently not ported

 - S2Loop
 - S2Polygon
 - S2Polyline
 
 
#### Extra code / differences

As already mentioned the lib is almost a 1:1 porting from the java's implementation.

The only exceptions are due javascript limitations such as
 - methods and properties can't share the same name
 - cant have multiple constructor
 - cant overload methods.
 
The lib also exports a `Utils` class which contains the following:

```typescript
export declare class Utils {
    /**
     * Calculates a region covering a circle
     * NOTE: The current implementation uses S2Cap while S2Loop would be better (S2Loop is not implemented yet)
     * @param center
     * @param radiusInKM
     * @param points the number of points to calculate. The higher the better precision
     * @returns {S2Region}
     */
    static calcRegionFromCenterRadius(center: S2LatLng, radiusInKM: number, points?: number): S2Region;
}
```

Also, for some classes, an extra `toGEOJSON` method is provided to let developer easily inspect boundaries of cells/points.



### Samples

#### Basic usage

```typescript
import { S2Cell, S2CellId, S2LatLng } from 'nodes2ts';

const cellId = S2CellId.fromPoint(
  S2LatLng.fromDegrees(10 /* latitude */, 11 /* longitude */).toPoint(),
);

console.log(cellId.id); // 11532778376507094629n
console.log(typeof cellId.id); // 'bigint'
console.log(cellId.toToken()); // stable hex token
```

#### Previous / next cell

```typescript
const nextCell = cellId.next();
const prevCell = cellId.prev();
```

#### Get all neighbors at the current level

```typescript
const neighbors = cellId.getAllNeighbors(cellId.level());
```

#### Signed / unsigned decimal migration helpers

```typescript
import {
  S2CellId,
  signedDecimalToUnsigned,
  unsignedToSignedDecimal,
} from 'nodes2ts';

const legacySigned = '-6533045114107854848';

const cell = new S2CellId(legacySigned);
console.log(cell.id); // 11913698959601696768n
console.log(cell.toSignedDecimalString()); // '-6533045114107854848'
console.log(cell.toUnsignedDecimalString()); // '11913698959601696768'

console.log(signedDecimalToUnsigned(legacySigned)); // 11913698959601696768n
console.log(unsignedToSignedDecimal(cell.id)); // '-6533045114107854848'
```

#### Construct from a legacy signed decimal explicitly

```typescript
const legacyCell = S2CellId.fromSignedDecimalString('-6533045114107854848');
console.log(legacyCell.id); // 11913698959601696768n
console.log(legacyCell.toToken()); // same canonical token as before
```

#### Rebuild from a token

```typescript
const fromToken = S2CellId.fromToken('89c25c');
console.log(fromToken.id); // bigint
console.log(fromToken.toToken()); // '89c25c'
```

#### Initialize a union from bigint ids

```typescript
import { S2CellUnion } from 'nodes2ts';

const union = new S2CellUnion();
union.initFromIds([
  0x89c25c0000000000n,
  0x89c25c4000000000n,
]);
```

#### Visualize an S2 cell as GeoJSON

```typescript
const cell = new S2Cell(cellId);
console.log(cell.toGEOJSON());
// copy the output and paste it into https://geojson.io/
```

## Contributing

The library was initially conceived to be used in both server and client env leveraging TypeScript peculiarities.

If you wish to contribute please make sure, wherever applicable, to create a tiny merge request to ease the code 
review of the proposed changes.

## Want to connect with the author?

If you wish to contact the library author for business (or any other) proposal you can write an email to `vekexasia` 
`at` gmail `dot` com.
