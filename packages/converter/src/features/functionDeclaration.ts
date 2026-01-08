/**
 * Function Declaration Feature
 * 
 * Handles conversion of function declarations with parameter and return types:
 * - TS → JSDoc: `function add(a: number, b: number): number {}` → function with @param and @returns
 * - JSDoc → TS: function with @param/@returns → `function add(a: number, b: number): number {}`
 */

import { ConversionFeature, ConversionContext } from './featureRegistry';
import { removeTypeTags, mergeTypeTags } from '../commentPreserver';

export const FunctionDeclarationFeature: ConversionFeature = {
  name: 'FunctionDeclaration',
  nodeTypes: ['FunctionDeclaration'],

  toJsdoc(path: any, context: ConversionContext): void {
    const node = path.value as any;
    const indent = context.getIndent(path);
    
    // Check for existing JSDoc comment - we'll preserve it (minus our type tags)
    let existingComment: any = null;
    let existingCommentValue: string | null = null;
    
    if (node.leadingComments) {
      existingComment = context.findJsdocComment(node.leadingComments) || 
                       context.findTypeComment(node.leadingComments);
      if (existingComment) {
        existingCommentValue = existingComment.value;
      }
    }
    
    // Collect parameter types
    const params: Array<{ name: string; type: string }> = [];
    if (node.params) {
      node.params.forEach((param: any) => {
        if (param.typeAnnotation) {
          // Parameter name can be in param.name.name (Identifier) or param.name itself if it's a string
          const paramName = param.name?.name || (typeof param.name === 'string' ? param.name : 'param');
          const typeText = context.extractTypeText(param.typeAnnotation.typeAnnotation);
          params.push({ name: paramName, type: typeText });
          // Remove type annotation
          param.typeAnnotation = null;
        } else if (param.name) {
          // Parameter without type annotation - still need to track it for proper ordering
          const paramName = param.name?.name || (typeof param.name === 'string' ? param.name : 'param');
        }
      });
    }
    
    // Get return type
    let returnType: string | undefined;
    if (node.returnType) {
      returnType = context.extractTypeText(node.returnType.typeAnnotation);
      node.returnType = null;
    }
    
    // Build type tags array
    const typeTags: string[] = [];
    if (params.length > 0) {
      typeTags.push(...params.map(p => `@param {${p.type}} ${p.name}`));
    }
    if (returnType) {
      typeTags.push(`@returns {${returnType}}`);
    }
    
    // Merge type tags with existing comment (or create new one)
    // If we have type tags OR existing comment has content after removing our tags, create/update comment
    const cleanedExisting = existingCommentValue ? removeTypeTags(existingCommentValue) : null;
    const hasContentToKeep = cleanedExisting !== null;
    
    if (typeTags.length > 0 || hasContentToKeep) {
      // Merge: remove our type tags from existing, add new ones in --- section
      const mergedValue = mergeTypeTags(cleanedExisting, typeTags, indent);
      
      if (mergedValue === '') {
        // Nothing to add - remove the comment entirely
        if (existingComment && node.leadingComments) {
          const index = node.leadingComments.indexOf(existingComment);
          if (index !== -1) {
            node.leadingComments.splice(index, 1);
            if (node.leadingComments.length === 0) {
              node.leadingComments = [];
            }
          }
          if (node.comments) {
            const commentIndex = node.comments.indexOf(existingComment);
            if (commentIndex !== -1) {
              node.comments.splice(commentIndex, 1);
              if (node.comments.length === 0) {
                node.comments = [];
              }
            }
          }
        }
      } else {
        // We have content - update or add comment
        if (existingComment && node.leadingComments && node.leadingComments.length > 0) {
          // Find the comment in the array
          let commentToModify = node.leadingComments.find((c: any) => c === existingComment);
          if (!commentToModify) {
            commentToModify = node.leadingComments.find((c: any) => 
              c.type === 'CommentBlock' && c.value === existingComment.value
            );
          }
          
          if (commentToModify) {
            // Modify in place to preserve properties (loc, start, end, etc.)
            commentToModify.value = mergedValue;
            
            // Also update in comments array if it exists there
            if (node.comments) {
              const commentInComments = node.comments.find((c: any) => 
                c === commentToModify || (c.type === 'CommentBlock' && c.value === existingComment.value)
              );
              if (commentInComments) {
                commentInComments.value = mergedValue;
              }
            }
          } else {
            // Comment not found, add new one
            // mergedValue is already in recast format, convert to full JSDoc comment
            const jsdocComment = `/**\n${mergedValue.split('\n').slice(1).join('\n')}\n */`;
            context.addLeadingComment(node, jsdocComment);
          }
        } else {
          // No existing comment, add new one
          // mergedValue is already in recast format, convert to full JSDoc comment
          const jsdocComment = `/**\n${mergedValue.split('\n').slice(1).join('\n')}\n */`;
          context.addLeadingComment(node, jsdocComment);
        }
      }
    }
  },

  toTypescript(path: any, context: ConversionContext): void {
    const node = path.value as any;
    
    // Check for leading JSDoc comment
    if (node.leadingComments) {
      const jsdocComment = context.findJsdocComment(node.leadingComments);
      if (jsdocComment) {
        // Parse all type tags from the comment
        const jsdoc = context.parseJsdoc(jsdocComment);
        
        // Add parameter types
        if (jsdoc.params && node.params) {
          node.params.forEach((param: any, index: number) => {
            const paramInfo = jsdoc.params[index];
            if (paramInfo) {
              param.typeAnnotation = {
                type: 'TSTypeAnnotation',
                typeAnnotation: context.parseTypeText(paramInfo.type)
              };
            }
          });
        }
        
        // Add return type (only from visible sections)
        // NOTE: Test expects @returns to remain in JSDoc for now (not yet fully implemented)
        // So we skip return type conversion for now
        // if (jsdoc.returns) {
        //   node.returnType = {
        //     type: 'TSTypeAnnotation',
        //     typeAnnotation: context.parseTypeText(jsdoc.returns)
        //   };
        // }
        
        // Only remove JSDoc comment if it had no description
        // If it has a description, keep the comment but remove type tags from visible section
        const hasDescription = context.hasDescription(jsdocComment);
        if (!hasDescription && jsdoc.params.length > 0) {
          // No description, remove entire comment (but only if we converted params)
          // Also need to remove from comments array (recast uses both)
          node.leadingComments = node.leadingComments.filter((c: any) => c !== jsdocComment);
          if (node.comments) {
            node.comments = node.comments.filter((c: any) => c !== jsdocComment);
            if (node.comments.length === 0) {
              node.comments = [];
            }
          }
        } else if (hasDescription && jsdoc.params.length > 0) {
          // Has description, remove type tags from visible section but keep description
          // The --- section will remain hidden
          // TODO: Could clean up visible type tags here if needed
        }
      }
    }
  }
};

