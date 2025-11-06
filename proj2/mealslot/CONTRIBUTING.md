# Contributing to MealSlot

We welcome contributions! This includes bug fixes, enhancements, documentation updates,
and tests.

By contributing, you agree that your contributions will be licensed under the **MIT License**.
You retain the copyright to your contributions.

---

## How to Contribute

1. **Fork the repository**  
   Click the “Fork” button on GitHub to create your own copy of the repo.

2. **Create a branch** for your work  
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make your changes**
  - Follow the existing code style: TypeScript + Prettier + ESLint
  - Include tests for any new functionality or bug fixes

4. **Run tests locally**
  ```bash
  pnpm test           # unit tests
  pnpm test:e2e       # end-to-end tests
  pnpm vitest run --coverage  # optional, check coverage
  ```

5. **Commit changes**
  - Use clear, descriptive commit messages
  ```bash
  git add .
  git commit -m "Add feature X: description"
  ```

6. **Push to your branch**
  ```bash
  git push origin feature/my-feature
  ```
7. **Open a Pull Request (PR)**
  - Target the main branch
  - Include a description of the changes and link any related issues

## Code Style
  - TypeScript with strict mode enabled
  - Prettier formatting
  - ESLint linting rules
  - Tailwind CSS for styling components

## Reporting Issues
If you encounter a bug or have a feature request:
1. Open a GitHub Issue in this repository
2. Provide:
   - Steps to reproduce (for bugs)
   - Expected behavior
   - Screenshots or videos if applicable
   - Any relevant system / browser info
We treat GitHub Issues as our public support forum.
Please check existing issues before opening a new one.

## Testing
Unit tests: tests/unit/
Component tests: tests/components/
End-to-end tests: tests/e2e/

Run tests and check coverage with:
  ```bash
  pnpm vitest run --coverage
  ```

## GitHub Etiquette

- Be respectful and constructive in comments
- Label your PRs appropriately (e.g., bug, enhancement, docs)
- If unsure about an API design or change, start a discussion in a GitHub Issue first

## License & Contributions

By contributing, you grant that your code and content will be licensed under MIT as
part of MealSlot. You retain ownership of your individual contributions.
