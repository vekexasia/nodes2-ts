import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/export.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
})
