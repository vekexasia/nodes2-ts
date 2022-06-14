import { Matrix3x3 } from "../src/Matrix3x3";
import { S2Cap } from "../src/S2Cap";
import { S2Point } from "../src/S2Point";

export function getRandomFrame(): Matrix3x3 {
  return getRandomFrameAt(randomPoint());
}

/**
* Given a unit-length z-axis, compute x- and y-axes such that (x,y,z) is a right-handed
* coordinate frame (three orthonormal vectors).
*/
export function getRandomFrameAt(z: S2Point): Matrix3x3 {
  const x = S2Point.normalize(S2Point.crossProd(z, randomPoint()));
  const y = S2Point.normalize(S2Point.crossProd(z, x));
  return Matrix3x3.fromCols(x, y, z);
}


export function randomPoint() {
  return S2Point.normalize(new S2Point(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1));
}

export function getRandomCap(minArea: number, maxArea: number): S2Cap {
  const capArea = maxArea * Math.pow(minArea / maxArea, Math.random());

  // The surface area of a cap is 2*Pi times its height.
  const point = randomPoint();
  return S2Cap.fromAxisArea(randomPoint(), capArea);
}