import * as vscode from 'vscode';
import {
  JsdocToTypescriptConverter,
  TypescriptToJsdocConverter,
  CommentMerger
} from 'ts-jsdoc-sync';

/**
 * Custom editor provider that displays .js files as TypeScript.
 * 
 * When a user opens a .js file, this provider:
 * 1. Reads the .js file content (with JSDoc) from the document
 * 2. Converts it to TypeScript syntax for display in the webview
 * 3. When the user edits, converts TypeScript back to JSDoc
 * 4. Updates the document with the JSDoc version
 */
export class TypeScriptCustomEditorProvider implements vscode.CustomTextEditorProvider {
  private jsdocToTs = new JsdocToTypescriptConverter();
  private tsToJsdoc = new TypescriptToJsdocConverter();
  private commentMerger = new CommentMerger();
  
  // Track if we're currently applying an edit per document to prevent recursive updates
  private applyingEdits = new Set<string>();

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Get the webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: []
    };

    // Read the original .js file content (document contains the .js file)
    const originalContent = document.getText();
    
    // Convert JSDoc to TypeScript for display
    const typescriptContent = this.jsdocToTs.convert(originalContent);

    // Set the initial content in the webview
    const updateWebview = (content: string) => {
      webviewPanel.webview.html = this.getWebviewContent(content);
    };

    // Initial update
    updateWebview(typescriptContent);

    // Handle messages from the webview (edits)
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'edit': {
          // User edited the TypeScript content
          const tsContent = message.content;
          
          // Convert TypeScript back to JSDoc
          const jsdocContent = this.tsToJsdoc.convert(tsContent);
          
          // Read the current document to merge comments
          const currentContent = document.getText();
          const mergedContent = this.commentMerger.merge(currentContent, jsdocContent);
          
          // Only update if content actually changed
          if (mergedContent !== currentContent) {
            const docUri = document.uri.toString();
            this.applyingEdits.add(docUri);
            try {
              // Update the document
              const edit = new vscode.WorkspaceEdit();
              const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
              );
              edit.replace(document.uri, fullRange, mergedContent);
              await vscode.workspace.applyEdit(edit);
            } finally {
              this.applyingEdits.delete(docUri);
            }
          }
          break;
        }
      }
    });

    // Handle document changes (when file is modified externally or by our edits)
    const docUri = document.uri.toString();
    const changeListener = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === docUri && !this.applyingEdits.has(docUri)) {
        const newContent = e.document.getText();
        const newTsContent = this.jsdocToTs.convert(newContent);
        updateWebview(newTsContent);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeListener.dispose();
    });
  }

  private getWebviewContent(initialContent: string): string {
    // Escape HTML special characters
    const escapedContent = initialContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypeScript Editor</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        #editor {
            width: 100%;
            height: 100vh;
            border: none;
            padding: 10px;
            box-sizing: border-box;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: var(--vscode-editor-line-height);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            white-space: pre;
            overflow-wrap: normal;
            overflow-x: auto;
            tab-size: 4;
        }
    </style>
</head>
<body>
    <textarea id="editor" spellcheck="false">${escapedContent}</textarea>
    <script>
        const vscode = acquireVsCodeApi();
        const editor = document.getElementById('editor');
        
        // Handle content changes
        let timeout;
        editor.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                vscode.postMessage({
                    type: 'edit',
                    content: editor.value
                });
            }, 300); // Debounce edits
        });
        
        // Handle external updates
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                editor.value = message.content;
            }
        });
    </script>
</body>
</html>`;
  }
}

