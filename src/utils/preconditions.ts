export function checkArgument(condition: boolean, message?: string) {
  if (!condition) {
    throw Error('IllegalArgumentException: ' + (message || ''));
  }
}

export function checkState(condition: boolean, message?: string) {
  if (!condition) {
    throw Error('IllegalStateException: ' + (message || ''));
  }
}