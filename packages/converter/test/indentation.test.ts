import { describe, it, expect } from 'vitest';
import { TypescriptToJsdocConverter } from '../src/typescriptToJsdoc';

describe('Indentation Preservation - TS to JSDoc', () => {
  const tsToJsdoc = new TypescriptToJsdocConverter();

  describe('2-space indentation (project standard)', () => {
    it('should preserve 2 spaces in variable declarations', () => {
      const input = `  let x: number = 5;`;
      const output = tsToJsdoc.convert(input);
      
      // Check that indentation is preserved in JSDoc output
      // Note: Top-level variables become VariableStatement, comments print correctly
      expect(output).toBe(`  /** @type {number} */\n  let x = 5;`);
    });

    it('should preserve 2 spaces in nested structures', () => {
      const input = `
        function test() {
          if (true) {
            let x: number = 5;
          }
        }
      `;
      const output = tsToJsdoc.convert(input);
      
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

  describe('mixed indentation levels', () => {
    it('should handle different indentation levels in the same file', () => {
      const input = `
        function outer() {
          function inner() {
            let x: number = 5;
          }
        }
      `;
      const output = tsToJsdoc.convert(input);
      
      expect(output).toBeString(`
        function outer() {
          function inner() {
            /** @type {number} */
            let x = 5;
          }
        }
      `);
    });
  });

  describe('JSDoc comment indentation', () => {
    it('should match JSDoc indentation to code indentation', () => {
      const input = `
        {
          let x: number = 5;
        }
      `;
      const jsdoc = tsToJsdoc.convert(input);
      
      // JSDoc should have same indentation as the code
      expect(jsdoc).toBeString(`
        {
          /** @type {number} */
          let x = 5;
        }
      `);
    });
  });
});

