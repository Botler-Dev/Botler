/* eslint-disable import/no-extraneous-dependencies, @typescript-eslint/no-var-requires */
const {rules: baseES6Rules} = require('eslint-config-airbnb-base/rules/es6');

module.exports = {
  env: {
    es2020: true,
  },
  plugins: ['@typescript-eslint', 'unicorn'],
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:unicorn/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts'],
      },
    },
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
      },
    ],
    // We do not use Flow and already use 'import/extensions'
    // See: https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-duplicates.md#when-not-to-use-it
    'import/no-duplicates': 'off',
    // Disallow default export https://basarat.gitbook.io/typescript/main-1/defaultisbad
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
    // In TypeScript getter and setter internal values should be stored in properties with an underscore prefix
    'no-underscore-dangle': ['error', {allowAfterThis: true}],
    // Types are often not the default export
    'unicorn/import-style': 'off',
    // Conflict with "consistent-return"
    'unicorn/no-useless-undefined': 'off',
    // Database entities have their optional fields set to null
    'unicorn/no-null': 'warn',
    // For loops are not allowed by the Airbnb style guide
    'unicorn/no-array-for-each': 'off',

    // Copied from https://github.com/airbnb/javascript/issues/1536#issuecomment-547416680
    'unicorn/import-index': 'off',
    'unicorn/prevent-abbreviations': 'off',
    // A base filename should exactly match the name of its default export
    // See: https://github.com/airbnb/javascript#naming--filename-matches-export
    'unicorn/filename-case': [
      'error',
      {cases: {camelCase: true, pascalCase: true, kebabCase: true}},
    ],
    // Improve compatibility with `unicorn/no-unreadable-array-destructuring`
    // See: https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/no-unreadable-array-destructuring.md#note
    'prefer-destructuring': [
      'error',
      {
        ...baseES6Rules['prefer-destructuring'][1],
        VariableDeclarator: {
          ...baseES6Rules['prefer-destructuring'][1].VariableDeclarator,
          array: false,
        },
        AssignmentExpression: {
          ...baseES6Rules['prefer-destructuring'][1].AssignmentExpression,
          array: false,
        },
      },
    ],
  },
};
