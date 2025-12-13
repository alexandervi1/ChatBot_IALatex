
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'react-markdown': '<rootDir>/src/components/chat/__mocks__/react-markdown.tsx',
    'rehype-highlight': '<rootDir>/src/components/chat/__mocks__/rehype-highlight.tsx',
  },
};
