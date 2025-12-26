module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'off', // Disabled - too many false positives
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off', // Disabled - intentional assertions

    // General rules
    'no-console': 'off', // Disabled - needed for debugging
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off', // Use TypeScript version instead

    // React rules
    'react-hooks/exhaustive-deps': 'off', // Disabled - often false positives
    'react/no-unescaped-entities': 'off',

    // Import rules - disabled to avoid cosmetic warnings
    'import/order': 'off'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    },
    {
      // Game files are standalone modules with intentionally exported global functions
      files: ['src/lib/games/**/*.js'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off',
        'prefer-const': 'off',
        'no-console': 'off'
      }
    }
  ]
};
