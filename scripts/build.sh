pnpm tsc -p tsconfig.cjs.json && pnpm tsc -p tsconfig.mjs.json

echo '{"type":"module"}' > dist/mjs/package.json
echo '{"type":"commonjs"}' > dist/cjs/package.json
