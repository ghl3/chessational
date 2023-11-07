// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1", // Add this line
  },
  testMatch: ["<rootDir>/src/**/*.test.(ts|tsx)"],
};
