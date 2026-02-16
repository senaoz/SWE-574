# The Hive Platform - Frontend

Modern React frontend for The Hive community service exchange platform, built with **React 18**, **TypeScript**, **Vite**, and **Radix UI**.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application runs at `http://localhost:3000`

## Tech Stack

### React 18
- Component-based architecture with hooks
- Context API for state management (auth, theme)
- React Router for client-side routing
- Custom hooks for reusable logic

### Vite
- **Fast HMR** - Instant hot module replacement during development
- **Optimized builds** - Production-ready bundles with code splitting
- **TypeScript support** - Full type checking and IntelliSense
- **Path aliases** - `@/` maps to `src/` for cleaner imports

### Radix UI
- **Accessible primitives** - Unstyled, accessible component building blocks
- **Composition pattern** - Flexible component APIs
- **Keyboard navigation** - Built-in accessibility support
- **Used components**: Dialog, Select, Toast, Button, Input

### TypeScript
- **Type safety** - Catch errors at compile-time, reduce runtime bugs
- **Better IDE support** - Enhanced autocomplete, refactoring, and navigation
- **Self-documenting code** - Types serve as inline documentation
- **Refactoring confidence** - Safe code changes with type checking
- **API contract validation** - Type-safe API client ensures backend compatibility

## Project Structure

```
src/
├── components/
│   ├── ui/              # Radix UI component wrappers
│   ├── auth/            # Authentication components
│   └── map/             # Google Maps integration
├── pages/               # Route components
├── services/           # API client
├── types/              # TypeScript definitions
└── utils/              # Helper functions
```

## Key Features

- **Interactive Service Map** - Google Maps with custom markers
- **Radix UI Components** - Accessible, customizable UI primitives
- **Fast Development** - Vite's instant HMR and optimized dev server
- **Type-Safe** - Full TypeScript coverage
- **Responsive Design** - Mobile-first with Tailwind CSS

## Development

### Using Radix UI
Components are wrapped with custom styling while maintaining Radix's accessibility:

```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    {/* Custom styled content */}
  </Dialog.Content>
</Dialog.Root>
```

### Vite Configuration
- Path aliases configured (`@/` → `src/`)
- Proxy setup for API requests
- Optimized production builds

### Environment Variables
```env
VITE_API_URL=http://localhost:8000
```

## Build & Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run preview  # Preview production build
```

### Docker
```bash
docker-compose up frontend
```

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **CSS Variables** - Theme customization
- **Mobile-first** - Responsive design approach

---

Built with React 18, TypeScript, Vite, and Radix UI for a modern, accessible, and performant user experience.
