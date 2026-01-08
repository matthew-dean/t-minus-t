# TypeScript Minus TypeScript - Project Rules

## Code Style

### Indentation
- **2 spaces** - Always use 2 spaces for indentation
- Enforced by Oxlint configuration
- No tabs allowed

### TypeScript
- Use strict mode (`strict: true` in tsconfig.json)
- Prefer explicit types over `any`
- Use TypeScript compiler API for AST manipulation
- Follow VSCode extension best practices

### Naming Conventions
- Files: `camelCase.ts` (e.g., `contentProvider.ts`)
- Classes: `PascalCase` (e.g., `TypeScriptContentProvider`)
- Functions/Methods: `camelCase` (e.g., `convertToJsdoc`)
- Constants: `UPPER_SNAKE_CASE` or `camelCase` depending on scope

### Comments
- Use JSDoc for public APIs
- Keep comments concise and meaningful
- Reference external documentation when appropriate

## Project Structure

```
src/
  extension.ts          # Main extension entry point
  contentProvider.ts    # TextDocumentContentProvider implementation
  converters/          # TypeScript ↔ JSDoc converters
    typescriptToJsdoc.ts
    jsdocToTypescript.ts
  commentMerger.ts      # Comment merging/de-merging logic
  dtsGenerator.ts      # .d.ts file generation
```

## Development Workflow

1. **Before committing**:
   - Run `pnpm run lint` to check for issues
   - Run `pnpm run compile` to ensure TypeScript compiles
   - Test the extension in VSCode

2. **When adding features**:
   - Update `.cursor/plan.md` with progress
   - Add JSDoc comments for new public APIs
   - Consider edge cases and error handling

3. **When fixing bugs**:
   - Document the issue in plan.md if significant
   - Add tests if possible (future: add test framework)
   - Verify fix doesn't break existing functionality

## Dependencies

- **PNPM 10**: Package manager
- **Node.js LTS**: Runtime (specified in `.nvmrc`)
- **TypeScript 5.6+**: Language and compiler API
- **VSCode API**: Extension development
- **Oxlint**: Linting (2-space indentation)

## JSDoc Conversion Rules

1. **Type annotations**: Always convert with newline separation
   - `let x: number = 5` → `/** @type {number} */\nlet x = 5`

2. **Comment preservation**:
   - Comments with descriptions → preserve as-is
   - Comments without descriptions → can be converted/regenerated

3. **Indentation**: Match the indentation of the code being annotated

4. **Formatting**: Follow JSDoc best practices and TypeScript JSDoc reference

## Extension Behavior

1. **Default behavior**: Extension activates on `.js` files
2. **Manual trigger**: Users can open files as TypeScript via command
3. **Auto-save**: .d.ts generation is off by default (user setting)
4. **Live editing**: Changes are debounced (300ms) for performance

## Error Handling

- Always show user-friendly error messages
- Log technical details to output channel (future: implement)
- Don't crash the extension on conversion errors
- Gracefully handle malformed code

## Performance

- Debounce rapid edits (300ms)
- Cache parsed ASTs when possible
- Avoid blocking the main thread
- Consider incremental updates for large files

## Testing Strategy

- **Use Vitest for testing**: Always use `pnpm test` (Vitest) to test implementations. Do not use `node -e` or other direct node commands to test code.
- **Use ts-node for debugging**: If you need to debug TypeScript code directly, use `ts-node` or similar tools that handle TypeScript compilation, not raw node commands with require() of dist files.
- **Tests use source files**: Vitest runs TypeScript source files directly, so changes to source files are immediately reflected in tests without needing to rebuild.

### Test Coverage (Future)

- Unit tests for converters
- Integration tests for content provider
- End-to-end tests for extension behavior
- Test with various JavaScript/TypeScript patterns

## Documentation

- Keep README.md clear and professional
- Document all public APIs with JSDoc
- Update plan.md as features are implemented
- Add examples and use cases

## Git Workflow

- Use meaningful commit messages
- Keep commits focused and atomic
- Reference issues/PRs when applicable


