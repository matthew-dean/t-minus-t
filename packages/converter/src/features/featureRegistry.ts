/**
 * Feature Registry Pattern
 * 
 * Each feature is registered with both conversion methods.
 * This makes it clear what features are supported and ensures
 * both directions are implemented.
 */

import { VariableDeclarationFeature } from './variableDeclaration';
import { FunctionDeclarationFeature } from './functionDeclaration';
// Add more features as they're implemented

export interface ConversionFeature {
  /**
   * Name of the feature (e.g., "VariableDeclaration", "FunctionDeclaration")
   */
  name: string;

  /**
   * Converts TypeScript syntax to JSDoc
   */
  toJsdoc: (path: any, context: ConversionContext) => void;

  /**
   * Converts JSDoc to TypeScript syntax
   */
  toTypescript: (path: any, context: ConversionContext) => void;

  /**
   * AST node types this feature handles (for visitor registration)
   */
  nodeTypes: string[];
}

export interface ConversionContext {
  sourceContent: string;
  extractTypeText: (type: any) => string;
  parseTypeText: (typeText: string) => any;
  getIndent: (path: any) => string;
  addLeadingComment: (node: any, comment: string) => void;
  findTypeComment: (comments: any[]) => any;
  findJsdocComment: (comments: any[]) => any;
  extractTypeFromComment: (comment: any) => string | null;
  parseJsdoc: (comment: any) => { params: Array<{ name: string; type: string }>; returns?: string };
  hasDescription: (comment: any) => boolean;
  extractDescription: (comment: any) => string | undefined;
  extractNonTypeTags: (comment: any) => string[];
}

/**
 * Registry of all supported conversion features
 */
export const FEATURES: ConversionFeature[] = [
  VariableDeclarationFeature,
  FunctionDeclarationFeature,
  // Add more features here as they're implemented
];

