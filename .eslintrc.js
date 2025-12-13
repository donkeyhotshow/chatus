module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    '@next/next/no-img-element': 'warn',
    '@next/next/no-page-custom-font': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    // Prevent console.log in production code
    'no-console': 'error',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [
    {
      // Allow console only in logger.ts
      files: ['src/lib/logger.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
