// lint-staged - https://github.com/lint-staged/lint-staged
// Lance ESLint --fix sur les fichiers TS/TSX staged.
// Le typecheck full reste en CI (trop lent en pre-commit sur projet complet).

module.exports = {
  '*.{ts,tsx}': ['eslint --fix'],
  '*.{js,mjs,cjs,jsx}': ['eslint --fix'],
  '*.{json,md,yml,yaml}': [], // no-op pour l'instant (Prettier non installe)
};
