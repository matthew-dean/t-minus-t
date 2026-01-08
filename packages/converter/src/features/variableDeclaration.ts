/**
 * Variable Declaration Feature
 * 
 * Handles conversion of variable declarations with type annotations:
 * - TS → JSDoc: `let x: number = 5` → `/** @type {number} *\/\nlet x = 5`
 * - JSDoc → TS: `/** @type {number} *\/\nlet x = 5` → `let x: number = 5`
 */

import { ConversionFeature, ConversionContext } from './featureRegistry';
import { createTypeJsdoc } from '../jsdocHelpers';
import * as ts from 'typescript';

export const VariableDeclarationFeature: ConversionFeature = {
  name: 'VariableDeclaration',
  nodeTypes: ['VariableDeclarator'],

  toJsdoc(path: any, context: ConversionContext): void {
    const node = path.value as any;
    // In TypeScript AST, VariableDeclarator has id (Identifier) which may have typeAnnotation
    if (node.id && node.id.typeAnnotation) {
      // Get type as string
      const typeText = context.extractTypeText(node.id.typeAnnotation.typeAnnotation);
      
      // Find the parent VariableStatement or VariableDeclaration
      // Top-level: VariableDeclarator -> VariableDeclaration -> VariableStatement -> Program
      // Block-level: VariableDeclarator -> VariableDeclaration -> BlockStatement -> Program
      // CRITICAL: Recast doesn't print comments on VariableDeclaration nodes inside BlockStatements
      // Solution: Wrap VariableDeclaration in VariableStatement when it's in a block
      let currentPath: any = path;
      let variableDeclaration: any = null;
      let variableStatement: any = null;
      let blockStatement: any = null;
      let targetNode: any = null;
      let targetPath: any = null;
      const pathTypes: string[] = [node.type];
      
      // Walk up the path to find VariableStatement, VariableDeclaration, and BlockStatement
      while (currentPath) {
        const parentValue = currentPath.parent?.value;
        if (parentValue) {
          pathTypes.push(parentValue.type);
          if (parentValue.type === 'VariableStatement') {
            // Top-level variable - attach comment ONLY to VariableStatement (recast can print it)
            variableStatement = parentValue;
            targetNode = parentValue;
            targetPath = currentPath.parent;
            break; // Stop here - we found the VariableStatement
          } else if (parentValue.type === 'VariableDeclaration' && !variableDeclaration) {
            // This is the VariableDeclaration node itself (we're inside it)
            variableDeclaration = parentValue;
            targetPath = currentPath.parent;
          } else if (parentValue.type === 'BlockStatement' && !blockStatement) {
            blockStatement = parentValue;
          }
        }
        currentPath = currentPath.parent;
      }
      
      // Decision: attach comment to VariableStatement if it exists (top-level),
      // otherwise to VariableDeclaration (block-level, needs post-processing)
      if (variableStatement) {
        // Top-level: attach to VariableStatement only (recast prints it)
        targetNode = variableStatement;
      } else if (variableDeclaration) {
        // Block-level: attach to VariableDeclaration (post-processing will insert it)
        targetNode = variableDeclaration;
      }
      
      // Get indentation - use target node if found, otherwise use current path
      const indentPath = targetPath || path;
      const indent = context.getIndent(indentPath);
      
      // Create JSDoc comment
      const jsdocComment = createTypeJsdoc(typeText, indent);
      
      // Remove type annotation from the identifier
      node.id.typeAnnotation = null;
      
      // Add JSDoc comment to the target node ONLY
      // For top-level: attach to VariableStatement (recast prints it)
      // For block-level: attach to VariableDeclaration (post-processing inserts it)
      // CRITICAL: Only attach to ONE node, never both
      if (targetNode) {
        // Ensure we're not also attaching to VariableDeclaration if we're attaching to VariableStatement
        if (targetNode.type === 'VariableStatement' && variableDeclaration) {
          // Make sure VariableDeclaration doesn't have the comment
          if (variableDeclaration.leadingComments) {
            variableDeclaration.leadingComments = variableDeclaration.leadingComments.filter((c: any) => 
              !c.value.includes('@type')
            );
          }
        }
        context.addLeadingComment(targetNode, jsdocComment);
      } else {
        // Fallback: add to VariableDeclarator (though recast may not print it)
        context.addLeadingComment(node, jsdocComment);
      }
    }
  },

  toTypescript(path: any, context: ConversionContext): void {
    const node = path.value as any;
    
    // Walk up the path to find VariableStatement or VariableDeclaration with comments
    let currentPath: any = path;
    let variableStatement: any = null;
    let variableDeclaration: any = null;
    let targetNode: any = null;
    
    while (currentPath) {
      const parentValue = currentPath.parent?.value;
      if (parentValue) {
        if (parentValue.type === 'VariableStatement') {
          variableStatement = parentValue;
          targetNode = parentValue;
          break;
        } else if (parentValue.type === 'VariableDeclaration' && !variableDeclaration) {
          variableDeclaration = parentValue;
          targetNode = parentValue;
        }
      }
      currentPath = currentPath.parent;
    }
    
    // Use VariableStatement if found, otherwise use VariableDeclaration
    if (!targetNode && variableDeclaration) {
      targetNode = variableDeclaration;
    }
    
    // Check both leadingComments and comments (recast uses both)
    const allComments = [
      ...(targetNode?.leadingComments || []),
      ...(targetNode?.comments || [])
    ];
    
    if (allComments.length > 0) {
      const typeComment = context.findTypeComment(allComments);
      if (typeComment) {
        const typeText = context.extractTypeFromComment(typeComment);
        if (typeText && node.id) {
          // Skip complex types (object types with properties) - not yet implemented
          // Complex types like { name: string; age: number } should remain as JSDoc
          // Check for nested object types: {{ ... }} or { ... : ... }
          if ((typeText.startsWith('{') && typeText.includes(':')) || 
              (typeText.includes('{{') && typeText.includes('}}'))) {
            // This is a complex object type, skip conversion entirely - don't touch the comment
            return; // Don't convert complex types yet - leave comment unchanged
          }
          
          // Check if comment has a description
          const hasDescription = context.hasDescription(typeComment);
          
          if (hasDescription) {
            // When there's a description, keep @type in the comment but don't add type annotation to code
            // Comment has description - preserve it but add @type
            const description = context.extractDescription(typeComment);
            const nonTypeTags = context.extractNonTypeTags(typeComment);
            
            // Create updated comment with description and @type in --- section
            // Recast expects comment.value to have "* " prefix on each line, with newlines
            const parts: string[] = [];
            
            if (description) {
              // extractDescription should return description without * prefix
              // But it might still have it, so remove any leading * and whitespace
              const cleanDesc = description.replace(/^\s*\*\s*/, '').trim();
              parts.push(`* ${cleanDesc}`);
            }
            
            if (nonTypeTags.length > 0) {
              if (parts.length > 0) parts.push('*');
              parts.push(...nonTypeTags.map(tag => `* ${tag}`));
            }
            
            // Add @type directly (no --- markers, no blank line)
            parts.push(`* @type {${typeText}}`);
            
            // Recast ADDS the code's base indentation to the comment value's indentation when printing
            // Extract the original comment's relative indentation (how many spaces more than the code)
            const originalValue = typeComment.value;
            const lines = originalValue.split('\n');
            let originalCommentIndent = '   '; // Default to 3 spaces
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              const match = line.match(/^(\s+)\*/);
              if (match && match[1].length > 0) {
                originalCommentIndent = match[1];
                break;
              }
            }
            // Get code's base indentation
            const codeIndent = context.getIndent(path);
            // Calculate relative indentation: original comment indent - code indent
            // If original was 9 spaces and code is 8 spaces, relative is 1 space
            const relativeIndent = originalCommentIndent.length > codeIndent.length 
              ? ' '.repeat(originalCommentIndent.length - codeIndent.length)
              : '';
            const commentIndent = relativeIndent; // Preserve relative indentation
            
            // Each part already has "* " prefix, we just need to add the comment indent (0 spaces) before it
            const updatedCommentValue = `*\n${parts.map(p => `${commentIndent}${p}`).join('\n')}\n${commentIndent}`;
            
            // Update the comment value
            typeComment.value = updatedCommentValue;
            
            // Also update in comments array if it exists there
            if (targetNode.comments) {
              const commentInComments = targetNode.comments.find((c: any) => c === typeComment);
              if (commentInComments) {
                commentInComments.value = updatedCommentValue;
              }
            }
          } else {
            // No description - add type annotation to code and remove the comment
            node.id.typeAnnotation = {
              type: 'TSTypeAnnotation',
              typeAnnotation: context.parseTypeText(typeText)
            };
            
            // Remove the comment entirely
            if (targetNode.leadingComments) {
              targetNode.leadingComments = targetNode.leadingComments.filter((c: any) => c !== typeComment);
              if (targetNode.leadingComments.length === 0) {
                targetNode.leadingComments = [];
              }
            }
            if (targetNode.comments) {
              targetNode.comments = targetNode.comments.filter((c: any) => c !== typeComment);
            if (targetNode.comments.length === 0) {
              targetNode.comments = [];
            }
          }
          }
        }
      }
    }
  }
};

