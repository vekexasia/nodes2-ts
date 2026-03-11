/** Shape of items in main-tests.json */
export interface MainTestItem {
  id: string;
  face: number;
  lvl: number;
  pos: string;
  token: string;
  i: number;
  j: number;
  s: string;
  t: string;
  u: string;
  v: string;
  next: string;
  prev: string;
  parent: string;
  parentLvl1: string;
  rangeMin: string;
  rangeMax: string;
  area: string;
  point: { x: string; y: string; z: string };
  coords: { lat: string; lng: string };
  cellCoords: { lat: string; lng: string };
  neighbors: string[];
  allNeighborsLvlP1: string[];
}

/** Shape of items in cell-tests.json */
export interface CellTestItem {
  id: string;
  face: number;
  lvl: number;
  orient: number;
  children: string[];
  vertices: Array<{ x: string; y: string; z: string }>;
  exactArea: string;
  center: { x: string; y: string; z: string };
  edges: Array<{ x: string; y: string; z: string }>;
  edgeNeighbors: string[];
  vertexNeighborsLvl: Array<{ lvl: number; v: string[] }>;
  rectBound: {
    lo: { lat: string; lng: string };
    hi: { lat: string; lng: string };
    cap: {
      angle: string;
      axis: { x: string; y: string; z: string };
      height: string;
    };
  };
}

/** Shape of items in union-tests.json */
export interface UnionTestItem {
  firstCells: string[];
  scndCells: string[];
  firstUnionResultCells: string[];
  scndUnionResultCells: string[];
  union: string[];
  intersectionUnionCells: string[];
}

/** Shape of items in latlng-tests.json */
export interface LatLngTestItem {
  latR: string;
  lngR: string;
  latD: string;
  lngD: string;
  distToCenter: string;
  distToCenterD: string;
  point: { x: string; y: string; z: string };
}

/** Shape of items in latlng-covering-tests.json */
export interface CoveringTestItem {
  maxLevel: number;
  minLevel: number;
  maxCells: number;
  levelMod: number;
  covering: string[];
  interior: string[];
  coveringUnionTokens: string[];
  rectBound: {
    lo: { lat: string; lng: string };
    hi: { lat: string; lng: string };
  };
}
