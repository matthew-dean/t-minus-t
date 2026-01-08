/**
 * Helper functions for creating JSDoc comments.
 * These are format-only helpers, not AST manipulation.
 * 
 * Type-only sections are wrapped in `---` markers to indicate they can be hidden/folded.
 */

/**
 * Create a JSDoc comment with @type tag.
 * Simple @type blocks are minimal and get hidden/folded automatically.
 */
export function createTypeJsdoc(typeText: string, indent: string = ''): string {
  return `${indent}/** @type {${typeText}} */`;
}

/**
 * Create a JSDoc comment with @param tags.
 */
export function createParamJsdoc(params: Array<{ name: string; type: string }>, indent: string = ''): string {
  if (params.length === 0) return '';
  const tags = params.map(p => `@param {${p.type}} ${p.name}`).join('\n * ');
  return `${indent}/**\n * ${tags}\n ${indent}*/`;
}

/**
 * Create a JSDoc comment with @returns tag.
 */
export function createReturnsJsdoc(returnType: string, indent: string = ''): string {
  return `${indent}/**\n * @returns {${returnType}}\n ${indent}*/`;
}

/**
 * Create a JSDoc comment with both @param and @returns tags.
 * Type tags are added directly without special markers.
 * Non-type tags (like @see, @deprecated, @example) are preserved.
 */
export function createFunctionJsdoc(
  params: Array<{ name: string; type: string }>,
  returnType: string | undefined,
  indent: string = '',
  existingDescription?: string,
  nonTypeTags: string[] = []
): string {
  const typeTags: string[] = [];
  
  if (params.length > 0) {
    typeTags.push(...params.map(p => `@param {${p.type}} ${p.name}`));
  }
  
  if (returnType) {
    typeTags.push(`@returns {${returnType}}`);
  }
  
  // Return empty only if there's nothing at all (no description, no tags, no type tags)
  if (typeTags.length === 0 && nonTypeTags.length === 0 && !existingDescription) return '';
  
  const parts: string[] = [];
  
  // Add description if present
  // Remove any leading * from description (it might have been extracted with formatting)
  if (existingDescription) {
    const cleanDesc = existingDescription.replace(/^\s*\*\s*/, '').trim();
    parts.push(` * ${cleanDesc}`);
  }
  
  // Add non-type tags
  if (nonTypeTags.length > 0) {
    if (parts.length > 0) {
      // Add blank line between description and tags if description exists
      parts.push(' *');
    }
    // Handle multi-line tags (like @example with content on next line)
    nonTypeTags.forEach(tag => {
      const lines = tag.split('\n');
      lines.forEach((line, index) => {
        if (index === 0) {
          // First line is the tag itself
          parts.push(` * ${line}`);
        } else {
          // Subsequent lines are continuation of the tag
          parts.push(` * ${line}`);
        }
      });
    });
  }
  
  // Add type tags directly (only if there are type tags)
  if (typeTags.length > 0) {
    if (parts.length > 0) {
      // Add blank line before type tags if there's content above
      parts.push(' *');
    }
    parts.push(...typeTags.map(tag => ` * ${tag}`));
  }
  
  return `${indent}/**\n${parts.join('\n')}\n ${indent}*/`;
}

