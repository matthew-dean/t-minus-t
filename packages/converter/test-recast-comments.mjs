const recast = require('recast');
const tsParser = require('recast/parsers/typescript');

// Test 1: Comment with 8 spaces (matching code indentation)
console.log('=== Test 1: Comment with 8 spaces ===');
const code1 = `        /**
         * This is a description
         * @type {number}
         */
        let x = 5;`;
const ast1 = recast.parse(code1, { parser: tsParser });
const varDecl1 = ast1.program.body[0];
console.log('Comment value:', JSON.stringify(varDecl1.leadingComments[0].value));
console.log('Printed:');
console.log(recast.print(ast1).code);
console.log('');

// Test 2: Comment with 9 spaces (1 more than code)
console.log('=== Test 2: Comment with 9 spaces ===');
const code2 = `        /**
          * This is a description
          * @type {number}
          */
        let x = 5;`;
const ast2 = recast.parse(code2, { parser: tsParser });
const varDecl2 = ast2.program.body[0];
console.log('Comment value:', JSON.stringify(varDecl2.leadingComments[0].value));
console.log('Printed:');
console.log(recast.print(ast2).code);
console.log('');

// Test 3: Modify comment value and see what happens
console.log('=== Test 3: Modify comment value to 8 spaces ===');
const ast3 = recast.parse(code2, { parser: tsParser });
const varDecl3 = ast3.program.body[0];
varDecl3.leadingComments[0].value = `*\n         * This is a description\n         * @type {number}\n         `;
console.log('Modified comment value:', JSON.stringify(varDecl3.leadingComments[0].value));
console.log('Printed:');
console.log(recast.print(ast3).code);
console.log('');

// Test 4: Modify comment value to 3 spaces (standard)
console.log('=== Test 4: Modify comment value to 3 spaces ===');
const ast4 = recast.parse(code2, { parser: tsParser });
const varDecl4 = ast4.program.body[0];
varDecl4.leadingComments[0].value = `*\n   * This is a description\n   * @type {number}\n   `;
console.log('Modified comment value:', JSON.stringify(varDecl4.leadingComments[0].value));
console.log('Printed:');
console.log(recast.print(ast4).code);
console.log('');

// Test 5: Check what getIndent returns for the variable
console.log('=== Test 5: Check variable line indentation ===');
const ast5 = recast.parse(code2, { parser: tsParser });
const varDecl5 = ast5.program.body[0];
const lines = code2.split('\n');
const varLine = lines[varDecl5.loc.start.line - 1];
console.log('Variable line:', JSON.stringify(varLine));
const match = varLine.match(/^(\s*)/);
console.log('Variable indent:', JSON.stringify(match ? match[1] : ''), 'length:', match ? match[1].length : 0);

