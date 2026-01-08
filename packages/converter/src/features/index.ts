/**
 * Feature Registry - Central location to see all supported features
 * 
 * Each feature must implement both:
 * - toJsdoc: Convert TypeScript → JSDoc
 * - toTypescript: Convert JSDoc → TypeScript
 */

export { FEATURES, ConversionFeature, ConversionContext } from './featureRegistry';
export { VariableDeclarationFeature } from './variableDeclaration';
export { FunctionDeclarationFeature } from './functionDeclaration';

// TODO: Add more features:
// - ArrowFunctionFeature
// - ClassPropertyFeature
// - InterfaceFeature
// - TypeAliasFeature
// - GenericFeature
// etc.

