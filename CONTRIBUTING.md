# Contributing to BurnerDrop

First off, thank you for considering contributing to BurnerDrop! We welcome contributions from everyone.

## Development Setup

1. **Fork & Clone**
   Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/your-username/burner-drop.git
   cd burner-drop
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   Create a `.env.local` file with the required `PINATA_JWT`.
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your keys
   ```

4. **Run the Server**
   ```bash
   npm run dev
   ```

## Creating a Pull Request

1. Create a new branch: `git checkout -b fix/your-fix` or `feat/your-feature`.
2. Make your changes in the codebase.
3. Ensure your code passes the linter: `npm run lint`.
4. Ensure the production build still passes: `npm run build`.
5. Commit your changes logically and with clear commit messages. We prefer conventional commits (e.g., `feat: added chunked upload`, `fix: corrected password encoding`).
6. Push your branch to your fork and submit a Pull Request against the `main` branch.

## Code of Conduct

Please be respectful and constructive when interacting with other contributors and maintainers.

## Reporting Bugs

Please use the provided Bug Report issue template to submit detailed bug reports. Ensure you include steps to reproduce, expected behavior, and your environment details.

## Feature Requests

Have a great idea? We'd love to hear it. Submit a feature request using the Feature Request issue template.
