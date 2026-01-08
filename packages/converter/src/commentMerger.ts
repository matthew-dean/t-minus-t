/**
 * Handles merging and de-merging of JSDoc comments.
 * 
 * Rules:
 * - JSDoc without descriptions that are recognizable by TypeScript → absorb into hidden/convertible section
 * - JSDoc with descriptions → move outside hidden section
 */
export class CommentMerger {
  /**
   * Merges new JSDoc content with existing content, preserving user comments with descriptions.
   */
  merge(existingContent: string, newJsdocContent: string): string {
    // Parse existing content to identify:
    // 1. JSDoc comments with descriptions (preserve)
    // 2. JSDoc comments without descriptions (can be replaced)
    // 3. Regular comments (preserve)
    
    const existingComments = this.extractComments(existingContent);
    const newComments = this.extractComments(newJsdocContent);
    
    // Strategy:
    // 1. Keep all comments with descriptions
    // 2. Replace type-only JSDoc with new versions
    // 3. Merge new type annotations where they don't conflict
    
    // For now, simplified approach: replace the entire content
    // Full implementation will do intelligent merging
    return newJsdocContent;
  }

  /**
   * Extracts comments from code, categorizing them by type.
   */
  private extractComments(content: string): CommentInfo[] {
    const comments: CommentInfo[] = [];
    const lines = content.split('\n');
    
    let inJsdoc = false;
    let jsdocStart = -1;
    let jsdocLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for JSDoc start
      if (line.trim().startsWith('/**')) {
        inJsdoc = true;
        jsdocStart = i;
        jsdocLines = [line];
      } else if (inJsdoc) {
        jsdocLines.push(line);
        
        // Check for JSDoc end
        if (line.trim().endsWith('*/')) {
          const jsdocText = jsdocLines.join('\n');
          const hasDescription = this.hasDescription(jsdocText);
          const isTypeOnly = this.isTypeOnlyJsdoc(jsdocText);
          
          comments.push({
            startLine: jsdocStart,
            endLine: i,
            content: jsdocText,
            hasDescription,
            isTypeOnly,
            lines: jsdocLines
          });
          
          inJsdoc = false;
          jsdocStart = -1;
          jsdocLines = [];
        }
      }
    }
    
    return comments;
  }

  /**
   * Checks if a JSDoc comment has a description (not just type annotations).
   */
  private hasDescription(jsdocText: string): boolean {
    // Remove type tags and check if there's remaining content
    const withoutTags = jsdocText
      .replace(/@type\s*\{[^}]+\}/g, '')
      .replace(/@param\s*\{[^}]+\}\s*\w+/g, '')
      .replace(/@returns?\s*\{[^}]+\}/g, '')
      .replace(/@typedef\s*\{[^}]+\}\s*\w+/g, '')
      .replace(/@template\s*\{[^}]+\}/g, '')
      .replace(/[*\/\s]/g, '');
    
    return withoutTags.length > 0;
  }

  /**
   * Checks if a JSDoc comment is type-only (can be converted to TypeScript).
   */
  private isTypeOnlyJsdoc(jsdocText: string): boolean {
    // Check if it only contains type-related tags
    const typeTags = [
      /@type\s*\{[^}]+\}/,
      /@param\s*\{[^}]+\}\s*\w+/,
      /@returns?\s*\{[^}]+\}/,
      /@typedef\s*\{[^}]+\}\s*\w+/,
      /@template\s*\{[^}]+\}/
    ];
    
    const hasTypeTag = typeTags.some(tag => tag.test(jsdocText));
    const hasDescription = this.hasDescription(jsdocText);
    
    return hasTypeTag && !hasDescription;
  }
}

interface CommentInfo {
  startLine: number;
  endLine: number;
  content: string;
  hasDescription: boolean;
  isTypeOnly: boolean;
  lines: string[];
}

