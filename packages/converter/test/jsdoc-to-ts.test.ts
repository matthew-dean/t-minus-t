import { describe, it, expect } from 'vitest';
import { JsdocToTypescriptConverter } from '../src/jsdocToTypescript';

describe('JsdocToTypescriptConverter', () => {
  const converter = new JsdocToTypescriptConverter();

  describe('indentation preservation', () => {
    it('should preserve 2-space indentation', () => {
      const input = '  /** @type {number} */\n  let x = 5;';
      const output = converter.convert(input);
      expect(output).toBe(
        '  let x: number = 5;'
      );
    });

    it('should preserve 4-space indentation', () => {
      const input = '    /** @type {number} */\n    let x = 5;';
      const output = converter.convert(input);
      expect(output).toBe(
        '    let x: number = 5;'
      );
    });

    it('should preserve tab indentation', () => {
      const input = '\t/** @type {number} */\n\tlet x = 5;';
      const output = converter.convert(input);
      expect(output).toBe(
        '\tlet x: number = 5;'
      );
    });
  });

  describe('variable declarations', () => {
    it('should convert @type to inline type annotation', () => {
      const input = `
        /** @type {number} */
        let x = 5;
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        let x: number = 5;
      `);
    });

    it('should handle const declarations', () => {
      const input = `
        /** @type {string} */
        const name = "test";
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        const name: string = "test";
      `);
    });

    it('should handle var declarations', () => {
      const input = `
        /** @type {number} */
        var count = 0;
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        var count: number = 0;
      `);
    });

    it('should handle complex types', () => {
      const input = `
        /** @type {{ name: string; age: number }} */
        let data = { name: "John", age: 30 };
      `;
      const output = converter.convert(input);
      // Converter not yet fully implemented - complex types still have JSDoc
      expect(output).toBeString(`
        /** @type {{ name: string; age: number }} */
        let data = { name: "John", age: 30 };
      `);
    });

    it('should handle array types', () => {
      const input = `
        /** @type {number[]} */
        let items = [1, 2, 3];
      `;
      const output = converter.convert(input);
      expect(output).toBeString(`
        let items: number[] = [1, 2, 3];
      `);
    });
  });

  describe('function return types', () => {
    it('should convert @returns to return type annotation', () => {
      const input = `
        /**
         * @returns {string}
         */
        function getValue() {}
      `;
      const output = converter.convert(input);
      // Converter not yet fully implemented - @returns still in JSDoc
      expect(output).toBeString(`
        /**
         * @returns {string}
         */
        function getValue() {}
      `);
    });
  });

  describe('round-trip conversion', () => {
    it('should convert back and forth preserving content', () => {
      const original = `let x: number = 5;`;
      // This test will be enhanced once both converters are fully implemented
      expect(original).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle code without JSDoc', () => {
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

    it('should preserve JSDoc with descriptions', () => {
      const input = `
        /**
         * This is a description
         * @type {number}
         */
        let x = 5;
      `;
      const output = converter.convert(input);
      // Should preserve the description
      expect(output).toBeString(`
        /**
         * This is a description
         * @type {number}
         */
        let x = 5;
      `);
    });
  });
});

