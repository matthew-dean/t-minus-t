import { expect } from 'vitest';

/**
 * Normalizes a string by:
 * 1. Removing the first line if it's just whitespace/newline
 * 2. Removing the last newline (if it's just whitespace)
 * 3. Counting initial spaces before first non-empty line
 * 4. Removing that amount of spaces from all lines
 * 5. Trimming trailing spaces per line (but keeping \n)
 */
function normalizeIndentation(str: string): string {
  if (!str) return str;
  
  let lines = str.split('\n');
  
  // Step 1: Remove first line if it's just whitespace/newline
  if (lines.length > 0 && /^\s*$/.test(lines[0])) {
    lines = lines.slice(1);
  }
  
  // Step 2: Remove last line if it's just whitespace/newline
  if (lines.length > 0 && /^\s*$/.test(lines[lines.length - 1])) {
    lines = lines.slice(0, -1);
  }
  
  if (lines.length === 0) return '';
  
  // Step 3: Count initial spaces before first non-empty line
  let baseIndent = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      const match = line.match(/^(\s*)/);
      baseIndent = match?.[1]?.length || 0;
      break;
    }
  }
  
  // Step 4: Remove baseIndent spaces from all lines
  // Step 5: Trim trailing spaces per line (but keep \n)
  const normalized = lines.map(line => {
    if (line.trim().length === 0) {
      return ''; // Empty lines stay empty
    }
    // Remove baseIndent from start
    const withoutIndent = line.slice(baseIndent);
    // Trim trailing spaces but keep the line structure
    return withoutIndent.replace(/[ \t]+$/, '');
  });
  
  return normalized.join('\n');
}

expect.extend({
  toBeString(received: string, expected: string) {
    /**
     * Normalizes both received and expected by removing common leading indentation.
     * This allows writing tests with proper indentation that matches the code style.
     */
    const normalizedReceived = normalizeIndentation(received);
    const normalizedExpected = normalizeIndentation(expected);

    return {
      // do not alter your "pass" based on isNot. Vitest does it for you
      pass: normalizedReceived === normalizedExpected,
      message: () => 'strings do not match',
      actual: normalizedReceived,
      expected: normalizedExpected
    };
  }
});

