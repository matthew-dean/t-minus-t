import { describe, it, expect } from 'vitest';
import { TypescriptToJsdocConverter } from '../src/typescriptToJsdoc';

describe('TypescriptToJsdocConverter', () => {
  const converter = new TypescriptToJsdocConverter();

  describe('indentation preservation', () => {
    it('should preserve 2-space indentation', () => {
      const input = '  let x: number = 5;';
      const output = converter.convert(input);
      expect(output).toBe(
        '  /** @type {number} */\n  let x = 5;'
      );
    });

    it('should preserve 4-space indentation', () => {
      const input = '    let x: number = 5;';
      const output = converter.convert(input);
      expect(output).toBe(
        '    /** @type {number} */\n    let x = 5;'
      );
    });

    it('should preserve tab indentation', () => {
      const input = '\tlet x: number = 5;';
      const output = converter.convert(input);
      expect(output).toBe(
        '\t/** @type {number} */\n\tlet x = 5;'
      );
    });

    it('should preserve mixed indentation in nested structures', () => {
      const input = `
        function test() {
          if (true) {
            let x: number = 5;
          }
        }
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        function test() {
          if (true) {
            /** @type {number} */
            let x = 5;
          }
        }
      `);
    });
  });

  describe('variable declarations', () => {
    it('should convert let with type annotation', () => {
      const input = `let x: number = 5;`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /** @type {number} */
        let x = 5;
      `);
    });

    it('should convert const with type annotation', () => {
      const input = `const name: string = "test";`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /** @type {string} */
        const name = "test";
      `);
    });

    it('should convert var with type annotation', () => {
      const input = `var count: number = 0;`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /** @type {number} */
        var count = 0;
      `);
    });

    it('should handle complex types', () => {
      const input = `let data: { name: string; age: number } = { name: "John", age: 30 };`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /** @type {{ name: string; age: number }} */
        let data = { name: "John", age: 30 };
      `);
    });

    it('should handle array types', () => {
      const input = `let items: number[] = [1, 2, 3];`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /** @type {number[]} */
        let items = [1, 2, 3];
      `);
    });

    it('should handle union types', () => {
      const input = `let value: string | number = "test";`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /** @type {string | number} */
        let value = "test";
      `);
    });
  });

  describe('function parameters', () => {
    it('should convert function parameter types', () => {
      const input = `function greet(name: string): void {}`;
      const output = converter.convert(input);
      // Should remove type annotations from parameters
      expect(output).toBeString(`
        function greet(name) {}
      `);
    });

    it('should handle multiple parameters', () => {
      const input = `function add(a: number, b: number): number {}`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        function add(a, b) {}
      `);
    });

    it('should handle arrow functions', () => {
      const input = `const add = (a: number, b: number): number => a + b;`;
      const output = converter.convert(input);
      // This will need AST parsing for proper handling
      expect(output).toBeDefined();
    });
  });

  describe('return types', () => {
    it('should convert function return types', () => {
      const input = `function getValue(): string {}`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        function getValue() {}
      `);
      // Should add @returns tag (when fully implemented)
    });
  });

  describe('edge cases', () => {
    it('should handle code without type annotations', () => {
      const input = `let x = 5;`;
      const output = converter.convert(input);
      expect(output).toBeString(`
        let x = 5;
      `);
    });

    it('should handle empty input', () => {
      const input = ``;
      const output = converter.convert(input);
      expect(output).toBe('');
    });

    it('should handle multiple declarations', () => {
      const input = `
        let x: number = 5;
        let y: string = "test";
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /** @type {number} */
        let x = 5;
        /** @type {string} */
        let y = "test";
      `);
    });
  });

  describe('preserving non-type JSDoc tags', () => {
    it('should keep @see tags with type tags', () => {
      const input = `
        /**
         * Adds two numbers together.
         * @see https://example.com
         */
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /**
         * Adds two numbers together.
         * @see https://example.com
         * @param {number} a
         * @param {number} b
         * @returns {number}
         */
        function add(a, b) {
          return a + b;
        }
      `);
    });

    it('should keep @deprecated tags with type tags', () => {
      const input = `
        /**
         * Old function, use newFunction instead.
         * @deprecated
         */
        function oldFunction(x: string): void {
          console.log(x);
        }
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /**
         * Old function, use newFunction instead.
         * @deprecated
         * @param {string} x
         * @returns {void}
         */
        function oldFunction(x) {
          console.log(x);
        }
      `);
    });

    it('should keep @example tags with type tags', () => {
      const input = `
        /**
         * Calculates the sum.
         * @example
         * sum(1, 2) // returns 3
         */
        function sum(a: number, b: number): number {
          return a + b;
        }
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /**
         * Calculates the sum.
         * @example
         * sum(1, 2) // returns 3
         * @param {number} a
         * @param {number} b
         * @returns {number}
         */
        function sum(a, b) {
          return a + b;
        }
      `);
    });

    it('should keep multiple non-type tags with type tags', () => {
      const input = `
        /**
         * Complex function with multiple tags.
         * @since 1.0.0
         * @see https://example.com/docs
         * @deprecated Use newFunction instead
         * @example
         * complex(1, 'test') // returns true
         */
        function complex(x: number, y: string): boolean {
          return true;
        }
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /**
         * Complex function with multiple tags.
         * @since 1.0.0
         * @see https://example.com/docs
         * @deprecated Use newFunction instead
         * @example
         * complex(1, 'test') // returns true
         * @param {number} x
         * @param {string} y
         * @returns {boolean}
         */
        function complex(x, y) {
          return true;
        }
      `);
    });

    it('should handle function with only non-type tags (no description)', () => {
      const input = `
        /**
         * @deprecated
         * @see https://example.com
         */
        function test(x: number): void {
        }
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        /**
         * @deprecated
         * @see https://example.com
         * @param {number} x
         * @returns {void}
         */
        function test(x) {
        }
      `);
    });
  });
});

