# TypeScript Minus TypeScript - Development Plan

## Overview

This extension allows you to write TypeScript syntax in `.js` files, but stores the code as JavaScript with JSDoc comments. Like Garfield Minus Garfield, but for TypeScript.

## Core Functionality

### 1. TextDocumentContentProvider ✅
- **Status**: Implemented
- **Location**: `src/contentProvider.ts`
- **Purpose**: Provides a virtual document view that displays TypeScript syntax while the underlying file contains JSDoc
- **Implementation**: Uses VSCode's `TextDocumentContentProvider` API with custom URI scheme `typescript-minus-typescript`

### 2. TypeScript → JSDoc Conversion ⚠️
- **Status**: Basic implementation (needs AST parsing)
- **Location**: `src/converters/typescriptToJsdoc.ts`
- **Requirements**:
  - Convert `let x: number = 5` → `/** @type {number} */\nlet x = 5` (with newline)
  - Support all JSDoc-supported TypeScript features per [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
  - Handle: types, functions, classes, interfaces, generics, unions, etc.
- **Next Steps**:
  - Integrate TypeScript compiler API for proper AST parsing
  - Implement full type annotation conversion
  - Handle complex types (generics, unions, intersections, etc.)

### 3. JSDoc → TypeScript Conversion ⚠️
- **Status**: Basic implementation (needs AST parsing)
- **Location**: `src/converters/jsdocToTypescript.ts`
- **Requirements**:
  - Convert JSDoc comments back to TypeScript syntax for display
  - Preserve code structure and formatting
  - Handle indentation (2 spaces)
- **Next Steps**:
  - Use TypeScript compiler API to parse JSDoc
  - Convert all JSDoc tags to TypeScript syntax
  - Handle edge cases and complex scenarios

### 4. Comment Merging/De-merging ⚠️
- **Status**: Basic structure (needs full implementation)
- **Location**: `src/commentMerger.ts`
- **Requirements**:
  - JSDoc without descriptions → absorb into hidden/convertible section
  - JSDoc with descriptions → preserve outside hidden section
  - Mark comments that should be removed for display
- **Next Steps**:
  - Implement intelligent comment detection
  - Add markers for comments that should be hidden in TypeScript view
  - Test with various comment patterns

### 5. Live Editing ✅
- **Status**: Implemented (with debouncing)
- **Location**: `src/contentProvider.ts` (`handleDocumentChange`)
- **Requirements**:
  - Real-time updates as user types
  - Convert TypeScript edits back to JSDoc
  - Debounce rapid changes (300ms)
- **Next Steps**:
  - Optimize performance for large files
  - Handle edge cases in conversion

### 6. .d.ts Generation ✅
- **Status**: Implemented
- **Location**: `src/dtsGenerator.ts`
- **Requirements**:
  - Use TypeScript compiler API (fastest/easiest)
  - Generate on save (if setting enabled)
  - Off by default
- **Next Steps**:
  - Test with various JavaScript patterns
  - Handle errors gracefully
  - Consider incremental generation

## JSDoc Support Matrix

Based on [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html):

### Types ✅ (Priority 1)
- [x] `@type` - Basic support
- [ ] `@import` - Import types
- [ ] `@param` / `@arg` / `@argument` - Function parameters
- [ ] `@returns` / `@return` - Return types
- [ ] `@typedef` - Type definitions
- [ ] `@callback` - Callback types
- [ ] `@template` - Generics
- [ ] `@satisfies` - Type satisfaction

### Classes ⚠️ (Priority 2)
- [ ] `@public`, `@private`, `@protected`, `@readonly` - Property modifiers
- [ ] `@override` - Override modifier
- [ ] `@extends` / `@augments` - Inheritance
- [ ] `@implements` - Interface implementation
- [ ] `@class` / `@constructor` - Class constructors
- [ ] `@this` - This context

### Documentation ✅ (Priority 3)
- [ ] `@deprecated` - Deprecation markers
- [ ] `@see` - References
- [ ] `@link` - Links

### Other ⚠️ (Priority 4)
- [ ] `@enum` - Enum definitions
- [ ] `@author` - Author information
- [ ] Other supported patterns

## Implementation Phases

### Phase 1: Core Infrastructure ✅
- [x] Project setup (PNPM, TypeScript, Oxlint)
- [x] Extension boilerplate
- [x] TextDocumentContentProvider skeleton
- [x] Basic converter structure

### Phase 2: Basic Conversion ⚠️
- [ ] Implement AST-based TypeScript → JSDoc conversion
- [ ] Implement AST-based JSDoc → TypeScript conversion
- [ ] Support basic types (`@type`)
- [ ] Support function parameters and returns
- [ ] Handle indentation correctly

### Phase 3: Advanced Features
- [ ] Full JSDoc support matrix
- [ ] Comment merging/de-merging
- [ ] Class support
- [ ] Generic types
- [ ] Union/intersection types

### Phase 4: Polish
- [ ] Error handling
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Documentation
- [ ] Testing

## Technical Decisions

1. **TypeScript Compiler API**: Using TypeScript's compiler API for AST parsing and .d.ts generation
2. **Debouncing**: 300ms debounce for live edits to balance responsiveness and performance
3. **URI Scheme**: `typescript-minus-typescript` for virtual documents
4. **Indentation**: 2 spaces (enforced by Oxlint)

## Open Questions

1. How to handle TypeScript features not supported by JSDoc?
2. Should we support JSX/TSX files?
3. How to handle imports and module types?
4. Should we provide a way to "lock" certain comments from conversion?

## References

- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)

