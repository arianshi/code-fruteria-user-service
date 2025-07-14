module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-case": [2, "always", ["lower-case", "upper-case"]],
    "body-max-line-length": [1, "always"],
    "body-max-length": [1, "always"],
  },
};
