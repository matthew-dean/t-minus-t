# @t-minus-t/converter

Core TypeScript ↔ JSDoc conversion utilities for the TypeScript Minus TypeScript project.

## Features

- Convert TypeScript syntax to JSDoc comments
- Convert JSDoc comments back to TypeScript syntax
- Preserve indentation and formatting
- Merge and de-merge comments intelligently

## Usage

```typescript
import {
  TypescriptToJsdocConverter,
  JsdocToTypescriptConverter,
  CommentMerger
} from '@t-minus-t/converter';

const tsToJsdoc = new TypescriptToJsdocConverter();
const jsdocToTs = new JsdocToTypescriptConverter();

// Convert TypeScript to JSDoc
const jsdoc = tsToJsdoc.convert('let x: number = 5;');
// Result: '/** @type {number} */\nlet x = 5;'

// Convert JSDoc to TypeScript
const ts = jsdocToTs.convert('/** @type {number} */\nlet x = 5;');
// Result: 'let x: number = 5;'
```

## Testing

This package has extensive unit tests covering:

- Indentation preservation (2-space, 4-space, tabs, mixed)
- Variable declarations (let, const, var)
- Function parameters and return types
- Complex types (objects, arrays, unions)
- Edge cases and round-trip conversions

Run tests with:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Development Status

The converters are currently using regex-based conversion for basic cases. Full AST-based parsing with TypeScript compiler API is planned for complete feature support.

