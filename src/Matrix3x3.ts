/*
 * Copyright 2013 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { S2Point } from "./S2Point";
import { checkArgument, checkState } from "./utils/preconditions";

/** A simple 3x3 matrix. */
// TODO(eengle): Rename this to Matrix as it is not necessarily 3x3, and make Matrix3x3 a subclass.
export class Matrix3x3 {
  private values: number[];
  private rows: number;
  private cols: number;

  /** Constructs a matrix from a series of column vectors. */
  public static fromCols(...columns: S2Point[]): Matrix3x3 {
    const result = new Matrix3x3(3, columns.length);
    for (let row = 0; row < result.rows; row++) {
      for (let col = 0; col < result.cols; col++) {
        result.set(row, col, columns[col].get(row));
      }
    }
    return result;
  }

  /** Constructs a 2D matrix of a fixed size. */
  public constructor(rows: number, cols: number) {
    checkArgument(rows >= 0, "Negative rows not allowed.");
    checkArgument(cols >= 0, "Negative cols not allowed.");
    this.rows = rows;
    this.cols = cols;
    this.values = new Array(rows * cols);
  }

  /** Constructs a 2D matrix of the given width and values. */
  public static fromValues(cols: number, ...values: number[]): Matrix3x3 {
    checkArgument(cols >= 0, "Negative rows not allowed.");
    const rows = values.length / cols;
    checkArgument(
        rows * cols == values.length, "Values not an even multiple of 'cols'");
    const result = new Matrix3x3(rows, cols);
    result.values = values;
    return result;
  }

  /** Returns the number of rows in this matrix. */
  public getRows(): number {
    return this.rows;
  }

  /** Returns the number of columns in this matrix. */
  public getCols(): number {
    return this.cols;
  }

  /** Sets a value. */
  public set(row: number, col: number, value: number): void {
    this.values[row * this.cols + col] = value;
  }

  /** Gets a value. */
  public get(row: number, col: number): number {
    return this.values[row * this.cols + col];
  }

  /** Returns the transpose of this. */
  public transpose(): Matrix3x3 {
    const result = new Matrix3x3(this.cols, this.rows);
    for (let row = 0; row < result.rows; row++) {
      for (let col = 0; col < result.cols; col++) {
        result.set(row, col, this.get(col, row));
      }
    }
    return result;
  }

  /** Returns the result of multiplying this x m. */
  public mult(m: Matrix3x3): Matrix3x3 {
    checkArgument(this.cols == m.rows);
    const result = new Matrix3x3(this.rows, m.cols);
    for (let row = 0; row < result.rows; row++) {
      for (let col = 0; col < result.cols; col++) {
        let sum = 0;
        for (let i = 0; i < this.cols; i++) {
          sum += this.get(row, i) * m.get(i, col);
        }
        result.set(row, col, sum);
      }
    }
    return result;
  }

  /** Return the vector of the given column. */
  public getCol(col: number): S2Point {
    checkState(this.rows == 3);
    checkArgument(0 <= col && col < this.cols);
    return new S2Point(this.values[col], this.values[this.cols + col], this.values[2 * this.cols + col]);
  }

  public equals(m: Matrix3x3): boolean {
    if (!(m instanceof Matrix3x3)) {
      return false;
    }
    if (this.rows != m.rows || this.cols != m.cols) {
      return false;
    }
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] != m.values[i]) {
        return false;
      }
    }
    return true;
  }
}