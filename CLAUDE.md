# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nodes2-ts is a TypeScript port of Google's S2 Geometry library for spherical geometry operations and geographic indexing. Published as `nodes2ts` on npm.

## Common Commands

```bash
# Build (produces CJS + ESM + type declarations in dist/)
npm run build

# Test
npm test               # Run all tests once
npm run test:watch     # Watch mode - auto-run on changes
npm run test:coverage  # Run with coverage report

# Lint
npm run lint           # ESLint check

# Clean
npm run clean          # Remove dist/ folder
```

To run a single test file:
```bash
npx vitest run test/S2CellId.test.ts
```

## Architecture

### Core Class Hierarchy

The library represents points on a unit sphere with hierarchical cell decomposition:

```
S2LatLng (lat/lng degrees)  →  S2Point (3D unit vector)  →  S2CellId (64-bit Hilbert curve ID)  →  S2Cell (bounded region)
```

### Key Classes

- **S2Point** - 3D normalized vector on unit sphere
- **S2LatLng** - Geographic coordinates; convert with `.toPoint()` / `S2LatLng.fromPoint()`
- **S2CellId** - 64-bit identifier using Hilbert curve; use `long` npm package for arithmetic
- **S2Cell** - Rectangular region on sphere face
- **S2Region** - Interface for regions (S2Cap, S2LatLngRect, S2CellUnion implement it)
- **S2RegionCoverer** - Approximates any S2Region as optimal set of cells

### Support Classes

- **S2** - Mathematical utilities (cross products, area, robust predicates)
- **S2Projections** - Face-to-sphere coordinate transformations
- **S2EdgeUtil** - Edge intersection and containment operations
- **S1Angle/S1ChordAngle** - Angular representations

### Entry Point

`src/export.ts` re-exports all public classes. The `Utils` class provides helper methods like `calcRegionFromCenterRadius()`.

## Development Notes

### TypeScript Adaptations from Java

Due to TypeScript limitations, the library uses:
- Static factory methods instead of constructor overloading (e.g., `S2CellId.fromPoint()`, `S2Cap.fromAxisAngle()`)
- Different names for methods vs properties that would conflict
- The `long` package for 64-bit integer cell IDs

### Testing

Tests are 1:1 comparisons with the Java reference implementation. When adding new features, generate corresponding tests using the Java code in `java-test-creator/` folder.

### Not Yet Ported

- S2Loop
- S2Polygon
- S2Polyline
