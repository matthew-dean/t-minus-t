import * as recast from 'recast';
import { FEATURES, ConversionContext } from './features';

const tsParser = require('recast/parsers/typescript');

/**
 * Converts JSDoc comments to TypeScript syntax for display.
 * 
 * Uses the feature registry to handle all supported JSDoc features.
 * Each feature implements its own toTypescript conversion logic.
 * 
 * Example: `/** @type {number} *\/\nlet x = 5` → `let x: number = 5`
 */
export class JsdocToTypescriptConverter {
  private sourceContent: string = '';

  convert(content: string): string {
    this.sourceContent = content;
    
    // Parse with recast (preserves formatting and JSDoc comments)
    const ast = recast.parse(content, {
      parser: tsParser
    });

    // Create conversion context with helper methods
    const context: ConversionContext = {
      sourceContent: this.sourceContent,
      extractTypeText: (type) => this.extractTypeText(type),
      parseTypeText: (typeText) => this.parseTypeText(typeText),
      getIndent: (path) => this.getIndent(path),
      addLeadingComment: (node, comment) => this.addLeadingComment(node, comment),
      findTypeComment: (comments) => this.findTypeComment(comments),
      findJsdocComment: (comments) => this.findJsdocComment(comments),
      extractTypeFromComment: (comment) => this.extractTypeFromComment(comment),
      parseJsdoc: (comment) => this.parseJsdoc(comment),
      hasDescription: (comment) => this.hasDescription(comment),
      extractDescription: (comment) => this.extractDescription(comment),
      extractNonTypeTags: (comment) => this.extractNonTypeTags(comment)
    };

    // Build visitor from registered features
    const visitor: any = {
      // Default: traverse all nodes to find nested declarations
      visitNode(path: any) {
        this.traverse(path);
      }
    };
    
    FEATURES.forEach(feature => {
      feature.nodeTypes.forEach(nodeType => {
        const visitorMethodName = `visit${nodeType}`;
        visitor[visitorMethodName] = function(path: any) {
          feature.toTypescript(path, context);
          this.traverse(path);
        };
      });
    });

    // Transform the AST
    recast.visit(ast, visitor);

    // Print with recast (preserves formatting)
    return recast.print(ast).code;
  }


  // Shared helper methods used by features
  private extractTypeText(type: any): string {
    if (type.type === 'TSNumberKeyword') return 'number';
    if (type.type === 'TSStringKeyword') return 'string';
    if (type.type === 'TSBooleanKeyword') return 'boolean';
    if (type.type === 'TSAnyKeyword') return 'any';
    if (type.type === 'TSVoidKeyword') return 'void';
    if (type.type === 'TSNullKeyword') return 'null';
    if (type.type === 'TSUndefinedKeyword') return 'undefined';
    
    if (type.type === 'TSUnionType') {
      return type.types.map((t: any) => this.extractTypeText(t)).join(' | ');
    }
    
    if (type.type === 'TSArrayType') {
      return `${this.extractTypeText(type.elementType)}[]`;
    }
    
    if (type.type === 'TSTypeLiteral') {
      return 'object';
    }
    
    if (type.type === 'TSTypeReference') {
      if (type.typeName?.name) {
        return type.typeName.name;
      }
    }
    
    return 'any';
  }

  private parseTypeText(typeText: string): any {
    typeText = typeText.trim();
    if (typeText === 'number') return { type: 'TSNumberKeyword' };
    if (typeText === 'string') return { type: 'TSStringKeyword' };
    if (typeText === 'boolean') return { type: 'TSBooleanKeyword' };
    if (typeText === 'any') return { type: 'TSAnyKeyword' };
    if (typeText === 'void') return { type: 'TSVoidKeyword' };
    
    if (typeText.endsWith('[]')) {
      const elementType = typeText.slice(0, -2);
      return {
        type: 'TSArrayType',
        elementType: this.parseTypeText(elementType)
      };
    }
    
    if (typeText.includes(' | ')) {
      const types = typeText.split(' | ').map(t => this.parseTypeText(t.trim()));
      return {
        type: 'TSUnionType',
        types
      };
    }
    
    return {
      type: 'TSTypeReference',
      typeName: {
        type: 'Identifier',
        name: typeText
      }
    };
  }

  private getIndent(path: any): string {
    const node = path.value as any;
    if (node.loc) {
      const lines = this.sourceContent.split('\n');
      const lineNum = node.loc.start.line - 1;
      if (lineNum >= 0 && lines[lineNum]) {
        const line = lines[lineNum];
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
      }
    }
    return '';
  }

  private addLeadingComment(node: any, comment: string): void {
    if (!node.comments) {
      node.comments = [];
    }
    const commentText = comment.replace(/\/\*\*|\*\//g, '').trim();
    node.comments.push({
      type: 'CommentBlock',
      value: ` ${commentText} `,
      leading: true,
      trailing: false
    });
  }

  private findTypeComment(comments: any[]): any {
    return comments.find((c: any) => 
      c.type === 'CommentBlock' && c.value.includes('@type')
    );
  }

  private findJsdocComment(comments: any[]): any {
    return comments.find((c: any) => 
      c.type === 'CommentBlock' && 
      (c.value.includes('@param') || c.value.includes('@returns'))
    );
  }

  private extractTypeFromComment(comment: any): string | null {
    // Extract @type from anywhere in the comment
    const match = comment.value.match(/@type\s*\{([^}]+)\}/);
    return match ? match[1].trim() : null;
  }

  private parseJsdoc(comment: any): { params: Array<{ name: string; type: string }>; returns?: string } {
    const params: Array<{ name: string; type: string }> = [];
    let returns: string | undefined;
    
    // Parse all type tags from the comment
    const paramRegex = /@param\s*\{([^}]+)\}\s+(\w+)/g;
    let match;
    while ((match = paramRegex.exec(comment.value)) !== null) {
      params.push({ name: match[2], type: match[1].trim() });
    }
    
    const returnsMatch = comment.value.match(/@returns?\s*\{([^}]+)\}/);
    if (returnsMatch) {
      returns = returnsMatch[1].trim();
    }
    
    return { params, returns };
  }

  private hasDescription(comment: any): boolean {
    if (!comment || comment.type !== 'CommentBlock') return false;
    
    // Check if there's non-tag content
    const content = comment.value;
    const withoutTags = content
      .replace(/@type\s*\{[^}]+\}/g, '')
      .replace(/@param\s*\{[^}]+\}\s+\w+/g, '')
      .replace(/@returns?\s*\{[^}]+\}/g, '')
      .replace(/[*\/\s]/g, '');
    return withoutTags.length > 0;
  }

  private extractDescription(comment: any): string | undefined {
    if (!this.hasDescription(comment)) return undefined;
    
    // Extract description (everything except tags)
    return comment.value
      .replace(/\/\*\*|\*\//g, '')
      .replace(/@type\s*\{[^}]+\}/g, '')
      .replace(/@param\s*\{[^}]+\}\s+\w+/g, '')
      .replace(/@returns?\s*\{[^}]+\}/g, '')
      .replace(/^\s*\*\s*/gm, '')
      .trim();
  }

  private extractNonTypeTags(comment: any): string[] {
    if (!comment || comment.type !== 'CommentBlock') return [];
    
    // Type-related tags that we manage
    const typeTags = ['@type', '@param', '@returns', '@return'];
    
    // Extract all JSDoc tags from the comment
    const tagRegex = /@(\w+)(?:\s+[^\n]*)?/g;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(comment.value)) !== null) {
      const tagName = `@${match[1]}`;
      const fullTag = match[0].trim();
      
      // Only include non-type tags
      if (!typeTags.includes(tagName)) {
        tags.push(fullTag);
      }
    }
    
    return tags;
  }
}
