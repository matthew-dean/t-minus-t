import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates .d.ts files from .js files using the TypeScript compiler API.
 * 
 * This uses the TypeScript compiler API for speed and ease of management.
 */
export class DtsGenerator {
  async generateDtsFile(document: vscode.TextDocument): Promise<void> {
    const jsPath = document.uri.fsPath;
    const dtsPath = jsPath.replace(/\.js$/, '.d.ts');

    try {
      // Read the JavaScript file
      const jsContent = document.getText();

      // Create a TypeScript compiler host
      const compilerOptions: ts.CompilerOptions = {
        declaration: true,
        emitDeclarationOnly: true,
        allowJs: true,
        checkJs: false,
        skipLibCheck: true
      };

      // Create a virtual file system for the compiler
      const host = ts.createCompilerHost(compilerOptions);
      const originalGetSourceFile = host.getSourceFile.bind(host);
      
      host.getSourceFile = (fileName: string, languageVersion: ts.ScriptTarget) => {
        if (fileName === jsPath || fileName.endsWith('.js')) {
          return ts.createSourceFile(
            fileName,
            jsContent,
            languageVersion,
            true,
            ts.ScriptKind.JS
          );
        }
        return originalGetSourceFile(fileName, languageVersion);
      };

      // Create a program
      const program = ts.createProgram([jsPath], compilerOptions, host);

      // Emit declaration files
      const emitResult = program.emit(undefined, (fileName, text) => {
        if (fileName.endsWith('.d.ts')) {
          // Write the .d.ts file
          const dir = path.dirname(fileName);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(fileName, text, 'utf-8');
        }
      });

      // Check for errors
      const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

      if (diagnostics.length > 0) {
        const errors = diagnostics
          .filter(d => d.category === ts.DiagnosticCategory.Error)
          .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));

        if (errors.length > 0) {
          vscode.window.showWarningMessage(
            `Generated .d.ts file with ${errors.length} error(s). Check the output for details.`
          );
        }
      } else {
        vscode.window.showInformationMessage(`Generated ${path.basename(dtsPath)}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to generate .d.ts file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

