### Node S2Geometry Typescript

An extensive port of google's s2 geometry library written in Typescript.

The library uses `decimal.js` and `long` as external libraries to perform the needed math.

Npm package is `nodes2ts`.

#### Tests
This project is backed by 60 1-by-1 comparison tests between this implementation and the original one.

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

- Convert Lat/Lng to S2CellId
```typescript
const cellId = S2CellId.fromPoint(
  S2LatLng.fromDegrees(10 /*latitude*/, 11 /*longitude*/)
);
```

- Get previous or next s2cell
```typescript
// const cellId;
const nextCell = cellId.next();
const prevCell = cellId.prev();
```


- Get All neighbor cell ids of cur level
```typescript
// const cellId;
const neighbors = cellId.getAllNeighbors(cellId.level());
```


- See S2cell on google maps
```typescript
const cell = new S2Cell(cellId);
console.log(cell.toGEOJSON());
// copy the output and paste it on http://geojson.io/
```




