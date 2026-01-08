/**
 * Helper to preserve existing JSDoc comments while managing only our type tags.
 * 
 * Strategy:
 * - Remove only @param, @returns, @type tags (and their content) from existing comments
 * - Preserve everything else (descriptions, @see, @deprecated, @example, etc.)
 * - If comment becomes empty after removing our tags, it should be removed entirely
 */

/**
 * Removes only our managed type tags from a JSDoc comment, preserving everything else.
 * Returns the cleaned comment value, or null if the comment should be removed entirely.
 */
export function removeTypeTags(commentValue: string): string | null {
  if (!commentValue) return null;
  
  // Remove our type tags: @param, @returns, @return, @type
  // These can be on their own lines or inline
  // We need to remove the entire line if it only contains a type tag
  
  let cleaned = commentValue;
  
  // Remove @type tags (can be inline: @type {number} or on own line)
  cleaned = cleaned.replace(/^\s*\*\s*@type\s*\{[^}]+\}\s*$/gm, '');
  
  // Remove @param tags (format: @param {type} name or @param {type} name description)
  // Match the entire line if it starts with @param
  cleaned = cleaned.replace(/^\s*\*\s*@param\s*\{[^}]+\}\s+\w+[^\n]*$/gm, '');
  
  // Remove @returns/@return tags
  cleaned = cleaned.replace(/^\s*\*\s*@returns?\s*\{[^}]+\}\s*[^\n]*$/gm, '');
  
  // Remove empty lines (lines with just * or whitespace)
  cleaned = cleaned.replace(/^\s*\*\s*$/gm, '');
  
  // Remove leading/trailing empty lines
  cleaned = cleaned.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');
  
  // Check if there's any content left (besides the opening * and closing)
  const content = cleaned
    .replace(/^[\s\S]*?\n\s*\*/, '') // Remove opening part
    .replace(/\n\s*\*[\s\S]*$/, '') // Remove closing part
    .trim();
  
  // If no content left, return null (comment should be removed)
  if (!content || content.length === 0) {
    return null;
  }
  
  return cleaned;
}

/**
 * Merges new type tags into an existing comment.
 * Adds type tags directly, preserving the existing comment content.
 * 
 * @param existingCommentValue - The existing comment value (in recast format with * prefixes)
 * @param typeTags - Array of type tag strings like "@param {number} x"
 * @param indent - Base indentation for the comment (not used, kept for API compatibility)
 * @returns The merged comment string, or empty string if nothing to add
 */
export function mergeTypeTags(
  existingCommentValue: string | null,
  typeTags: string[],
  indent: string = ''
): string {
  const parts: string[] = [];
  
  // If we have existing comment content, preserve it (minus our type tags)
  if (existingCommentValue) {
    const cleaned = removeTypeTags(existingCommentValue);
    if (cleaned) {
      // The cleaned value is already in recast format (with * prefixes)
      // Extract lines and normalize indentation - remove base indentation, keep just " * " prefix
      const lines = cleaned.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines and the opening * line (if present)
        if (trimmed && trimmed !== '*') {
          // Normalize: remove any leading spaces, then add " * " prefix
          // This ensures consistent formatting regardless of original indentation
          const content = trimmed.replace(/^\*\s*/, ''); // Remove * and spaces
          if (content) {
            parts.push(` * ${content}`);
          }
        }
      }
    }
  }
  
  // Add type tags directly (only if we have type tags)
  // Don't add blank line - preserve original formatting
  if (typeTags.length > 0) {
    parts.push(...typeTags.map(tag => ` * ${tag}`));
  }
  
  // If no content at all, return empty string
  if (parts.length === 0) {
    return '';
  }
  
  // Format for recast: first line is just "*", then content lines, then trailing
  const result = ['*', ...parts].join('\n') + '\n ';
  
  return result;
}

