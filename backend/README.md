# Taxi Platform

A comprehensive taxi booking platform built with Node.js, React, and React Native.

## Project Structure

- `backend/` - Express.js API server
- `frontend-admin/` - React admin panel
- `mobile-rider/` - React Native rider app
- `mobile-driver/` - React Native driver app
- `shared/` - Shared utilities and types
- `docs/` - Project documentation

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB
- VS Code

### Installation
1. Clone the repository
2. Install dependencies in each directory
3. Set up environment variables
4. Start MongoDB service
5. Run the development servers

## Development

### Backend
```bash
cd backend
npm run dev
Frontend
bashcd frontend-admin
npm run dev
Contributing

Fork the repository
Create a feature branch
Make your changes
Submit a pull request


### 6.2 VS Code Workspace Configuration
Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.js": "javascript"
  },
  "eslint.workingDirectories": ["backend", "frontend-admin"]
}