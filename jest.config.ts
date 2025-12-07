import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/**/*.test.(ts|tsx)"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.tsx",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts",
    "!src/hooks/**",
    "!src/app/**",
    "!src/context/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 65,
      statements: 65,
    },
  },
};

export default config;
