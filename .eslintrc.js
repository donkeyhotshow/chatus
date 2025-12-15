module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript',
    '@typescript-eslint-cucommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Next.js specific
    '@next/next/no-img-element': 'warn',
    '@next/next/no-page-custom-font': 'off',

    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

    // Performance
    'no-console': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // React
    'react/jsx-key': 'error',
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
    'react/jsx-no-leaked-render': 'error',
    'react/no-array-index-key': 'warn',
    'react/self-closing-comp': 'error',

    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
  },
  overrides: [
    {
      files: ['src/lib/logger.ts'],
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    },
    {
      files: ['*.config.js', '*.config.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};
