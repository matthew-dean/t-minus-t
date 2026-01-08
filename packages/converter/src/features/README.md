# Feature-Based Conversion Architecture

This directory contains the feature-based conversion system. Each TypeScript language feature has its own file with **both** conversion directions clearly defined.

## Architecture

### Feature Registry Pattern

Each feature is registered in `featureRegistry.ts` and must implement:
- `toJsdoc`: Converts TypeScript syntax → JSDoc
- `toTypescript`: Converts JSDoc → TypeScript syntax

### Benefits

1. **Clear Feature List**: See all supported features in `featureRegistry.ts`
2. **Bidirectional Guarantee**: Each feature must implement both directions
3. **Easy to Extend**: Add a new feature file and register it
4. **Co-located Logic**: All conversion logic for a feature is in one place

## Current Features

- ✅ `VariableDeclaration` - Variable type annotations (`let x: number`)
- ✅ `FunctionDeclaration` - Function parameters and return types

## Adding a New Feature

1. Create a new file: `features/yourFeature.ts`
2. Implement the `ConversionFeature` interface:

```typescript
export const YourFeature: ConversionFeature = {
  name: 'YourFeature',
  nodeTypes: ['YourNodeType'], // AST node types this handles
  
  toJsdoc(path: any, context: ConversionContext): void {
    // Convert TS → JSDoc
    const node = path.value;
    // ... your conversion logic
  },
  
  toTypescript(path: any, context: ConversionContext): void {
    // Convert JSDoc → TS
    const node = path.value;
    // ... your conversion logic
  }
};
```

3. Register it in `featureRegistry.ts`:

```typescript
export const FEATURES: ConversionFeature[] = [
  VariableDeclarationFeature,
  FunctionDeclarationFeature,
  YourFeature, // ← Add here
];
```

4. The converters automatically pick it up!

## Conversion Context

The `ConversionContext` provides helper methods available to all features:
- `extractTypeText` - Convert AST type node to string
- `parseTypeText` - Convert type string to AST node
- `getIndent` - Get indentation for a node
- `addLeadingComment` - Add JSDoc comment to a node
- `findTypeComment` - Find @type comment
- `parseJsdoc` - Parse JSDoc tags

## Example: Adding Arrow Function Support

```typescript
// features/arrowFunction.ts
export const ArrowFunctionFeature: ConversionFeature = {
  name: 'ArrowFunction',
  nodeTypes: ['ArrowFunctionExpression'],
  
  toJsdoc(path: any, context: ConversionContext): void {
    // Handle arrow function parameters and return type
    // Similar to FunctionDeclaration but for arrow functions
  },
  
  toTypescript(path: any, context: ConversionContext): void {
    // Convert JSDoc back to arrow function type annotations
  }
};
```

Then register it in `featureRegistry.ts`.

