export {}
declare global {
  namespace decimal {
    interface IDecimalStatic {
      cos(x: string|number|Decimal): Decimal;
      sin(x: string|number|Decimal): Decimal;
      min(a: string|number|Decimal, b: string|number|Decimal): Decimal
      max(a: string|number|Decimal, b: string|number|Decimal): Decimal
      atan2(y: string|number|Decimal, x: string|number|Decimal): Decimal
      atan(x: string|number|Decimal): Decimal
      tan(y: string|number|Decimal): Decimal
      asin(x:string|number|Decimal): Decimal;
      acos(x:string|number|Decimal): Decimal;
      round(x:string|number|Decimal): Decimal

    }
    interface Decimal {
      cos(): Decimal;
      sin(): Decimal;
      asin(): Decimal;
    }


  }

}