/**
 * Comment insertion utility for recast workaround.
 * 
 * KNOWN LIMITATION: Recast doesn't print comments on VariableDeclaration nodes
 * (neither top-level nor in BlockStatements). This is a documented recast limitation.
 * 
 * This utility manually inserts comments that recast failed to print by:
 * 1. Walking the AST to find VariableDeclaration nodes with leadingComments
 * 2. Checking if those comments were printed by recast
 * 3. Manually inserting unprinted comments at the correct line/indent
 * 
 * This is a clean workaround that maintains good DX while working around recast's limitation.
 */

export interface CommentInsertion {
  line: number;
  comment: string;
  indent: string;
}

/**
 * Finds VariableDeclaration nodes with comments that recast didn't print.
 * Returns an array of insertions to make.
 */
export function findUnprintedComments(ast: any, printedCode: string): CommentInsertion[] {
  const lines = printedCode.split('\n');
  const insertions: CommentInsertion[] = [];

  const walk = (node: any, parent: any = null, depth = 0): void => {
    if (depth > 15) return; // Safety limit

    // Recast doesn't print comments on VariableDeclaration nodes (neither top-level nor in blocks).
    // We need to manually insert all VariableDeclaration comments via post-processing.
    // The only exception is if the comment was attached to a VariableStatement parent (which recast CAN print).
    if (node.type === 'VariableDeclaration' && node.leadingComments?.length > 0) {
      // Skip if parent is VariableStatement - comment was attached to parent, not this node
      // (recast already printed it on the VariableStatement, so we don't need to insert it)
      if (parent?.type === 'VariableStatement') {
        return;
      }
      
      // For all other VariableDeclaration nodes (top-level or in blocks), recast doesn't print comments.
      // We need to insert them, but first check if recast somehow already printed it (shouldn't happen).
      
      // Process this VariableDeclaration - recast doesn't print comments on VariableDeclaration nodes
      // Check if recast already printed it anyway (shouldn't happen, but double-check to avoid duplicates)
      if (node.loc) {
        const comment = node.leadingComments[0];
        const commentText = comment.value.trim();
        const formattedComment = `/** ${commentText.replace(/^\*\s*/, '')} */`;
        const lineNum = node.loc.start.line - 1;

        if (lineNum >= 0 && lineNum < lines.length) {
          const targetLine = lines[lineNum];
          const indentMatch = targetLine.match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[1] : '';

          // Check if comment was already printed by recast
          // Look at the line before the target (where recast would print it for VariableStatement)
          // Also check a few lines before in case of spacing
          const lineBeforeTarget = lineNum > 0 ? lines[lineNum - 1] : '';
          const lineTwoBefore = lineNum > 1 ? lines[lineNum - 2] : '';
          const alreadyPrinted = 
            (lineBeforeTarget.includes('@type') && lineBeforeTarget.includes('*/')) ||
            (lineBeforeTarget.trim().startsWith('/**') && lineBeforeTarget.includes('@type')) ||
            (lineTwoBefore.includes('@type') && lineTwoBefore.includes('*/')) ||
            (lineTwoBefore.trim().startsWith('/**') && lineTwoBefore.includes('@type'));
          
          if (!alreadyPrinted) {
            insertions.push({ line: lineNum, comment: formattedComment, indent });
          }
        }
      }
    }

    // Recurse into all child properties generically
    // Skip certain properties that aren't AST nodes or that we don't want to traverse
    const skipProps = new Set(['loc', 'range', 'leadingComments', 'trailingComments', 'comments', 'parent', 'raw']);
    
    for (const key in node) {
      if (skipProps.has(key)) continue;
      
      const value = node[key];
      
      // Recurse into arrays of nodes
      if (Array.isArray(value)) {
        value.forEach((child: any) => {
          if (child && typeof child === 'object' && child.type) {
            walk(child, node, depth + 1);
          }
        });
      }
      // Recurse into single node objects
      else if (value && typeof value === 'object' && value.type) {
        // Skip VariableDeclaration.declarations - those are VariableDeclarator nodes,
        // not VariableDeclaration nodes, and we don't want to process the same VariableDeclaration twice
        if (key === 'declarations' && node.type === 'VariableDeclaration') {
          continue;
        }
        walk(value, node, depth + 1);
      }
    }
  };

  walk(ast.program);
  return insertions;
}

/**
 * Inserts comments into code at the specified positions.
 * Comments are inserted in reverse line order to avoid offset issues.
 */
export function insertComments(code: string, insertions: CommentInsertion[]): string {
  if (insertions.length === 0) return code;

  const lines = code.split('\n');
  
  // Remove duplicates: same line and same comment
  const uniqueInsertions = new Map<string, CommentInsertion>();
  for (const insertion of insertions) {
    const key = `${insertion.line}:${insertion.comment}`;
    if (!uniqueInsertions.has(key)) {
      uniqueInsertions.set(key, insertion);
    }
  }
  const deduplicated = Array.from(uniqueInsertions.values());
  
  // Sort descending by line number to insert from bottom to top
  // This prevents line number offsets from affecting subsequent insertions
  deduplicated.sort((a, b) => b.line - a.line);
  
  for (const { line, comment, indent } of deduplicated) {
    lines.splice(line, 0, `${indent}${comment}`);
  }
  
  return lines.join('\n');
}

