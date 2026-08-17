# Contributing to do.it

First off, thank you for considering contributing to **do.it**! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please create an issue detailing:
1. What you were doing when the bug occurred.
2. What you expected to happen.
3. What actually happened.
4. Steps to reproduce the behavior.

### Suggesting Enhancements
Have an idea for a new feature? We'd love to hear it! Open an issue and:
1. Describe the feature in detail.
2. Explain why this enhancement would be useful to most users.
3. Keep the scope manageable.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code lints correctly.
5. Update the documentation if you've changed APIs or features.
6. Issue that pull request!

## Local Development Setup

To set up the MERN stack locally:

1. Clone the repository.
2. Run `npm install` in both the `/frontend` and `/backend` directories.
3. Set up your `.env` files (refer to the [Documentation](https://docs.uraj.dev/doit-mern) for the required environment variables).
4. Run `npm run dev` in the frontend and `node server.js` in the backend.

## Coding Guidelines
* We use a strict "liquid glass" aesthetic in our UI components. Try to stick to the existing CSS variables rather than hardcoding new hex colors.
* All Express API routes should be thoroughly tested and return standardized JSON responses.

Thanks again for helping make **do.it** better!
