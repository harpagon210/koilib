module.exports = {
  root: true,
  extends: [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:prettier/recommended",
  ],
  plugins: ["eslint-plugin-tsdoc"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  rules: {
    "tsdoc/syntax": "warn",
    "import/no-cycle": "off",
  },
};
