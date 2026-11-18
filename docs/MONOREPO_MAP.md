# SaaS Commerce Monorepo Structure

```text
saas-commerce
├── .env
├── .gitattributes
├── .gitignore
├── .npmrc
├── AGENTS.md
├── apps
│   └── admin
│       ├── .env
│       ├── .gitignore
│       ├── app.js
│       ├── components.json
│       ├── eslint.config.js
│       ├── next-env.d.ts
│       ├── next.config.js
│       ├── package.json
│       ├── postcss.config.js
│       ├── public
│       │   ├── file-text.svg
│       │   ├── globe.svg
│       │   ├── next.svg
│       │   ├── turborepo-dark.svg
│       │   ├── turborepo-light.svg
│       │   ├── vercel.svg
│       │   └── window.svg
│       ├── README.md
│       ├── src
│       │   ├── app
│       │   │   ├── (super-admin)
│       │   │   │   ├── actions - Copy.ts
│       │   │   │   ├── actions.ts
│       │   │   │   ├── layout.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── api
│       │   │   │   ├── auth
│       │   │   │   ├── fix-authors
│       │   │   │   ├── fix-authors-comma
│       │   │   │   ├── storefront
│       │   │   │   └── uploadthing
│       │   │   ├── favicon.ico
│       │   │   ├── fix-authors
│       │   │   │   └── page.tsx
│       │   │   ├── fix-authors-comma
│       │   │   │   └── page.tsx
│       │   │   ├── fonts
│       │   │   │   ├── GeistMonoVF.woff
│       │   │   │   └── GeistVF.woff
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   ├── page.module.css
│       │   │   └── [storeSlug]
│       │   │       ├── dashboard
│       │   │       └── login
│       │   ├── components
│       │   │   └── ui
│       │   │       ├── badge.tsx
│       │   │       ├── button.tsx
│       │   │       ├── card.tsx
│       │   │       ├── dialog.tsx
│       │   │       ├── input.tsx
│       │   │       ├── label.tsx
│       │   │       ├── scroll-area.tsx
│       │   │       ├── select.tsx
│       │   │       ├── separator.tsx
│       │   │       └── table.tsx
│       │   ├── lib
│       │   │   ├── db
│       │   │   │   └── index.ts
│       │   │   ├── uploadthing.ts
│       │   │   └── utils.ts
│       │   └── scripts
│       │       └── test-ai.ts
│       ├── tailwind.config.js
│       └── tsconfig.json
├── generate-saas-maps.js
├── package.json
├── packages
│   ├── db
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   └── schema
│   │   │       └── index.ts
│   │   └── tsconfig.json
│   ├── eslint-config
│   │   ├── base.js
│   │   ├── next.js
│   │   ├── package.json
│   │   ├── react-internal.js
│   │   └── README.md
│   ├── typescript-config
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   ├── package.json
│   │   └── react-library.json
│   └── ui
│       ├── eslint.config.mjs
│       ├── package.json
│       ├── src
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── code.tsx
│       └── tsconfig.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
└── turbo.json
```

## Workspace Packages & Dependencies

### `packages/db` (@repo/db)
- **Dependencies:** dotenv, drizzle-orm, mysql2
- **DevDependencies:** @types/node, drizzle-kit, typescript

### `packages/eslint-config` (@repo/eslint-config)
- **Dependencies:** None
- **DevDependencies:** @babel/core, @babel/eslint-parser, @babel/preset-typescript, @eslint/js, @next/eslint-plugin-next, eslint, eslint-config-prettier, eslint-plugin-only-warn, eslint-plugin-react-hooks, eslint-plugin-turbo, globals

### `packages/typescript-config` (@repo/typescript-config)
- **Dependencies:** None
- **DevDependencies:** None

### `packages/ui` (@repo/ui)
- **Dependencies:** react, react-dom
- **DevDependencies:** @repo/eslint-config, @repo/typescript-config, @types/node, @types/react, @types/react-dom, eslint, typescript

### `apps/admin` (web)
- **Dependencies:** @radix-ui/react-dialog, @radix-ui/react-label, @radix-ui/react-scroll-area, @radix-ui/react-select, @radix-ui/react-separator, @radix-ui/react-slot, @repo/db, @uploadthing/react, bcryptjs, class-variance-authority, clsx, drizzle-orm, lucide-react, mysql2, next, react, react-dom, tailwind-merge, tailwindcss-animate, uploadthing
- **DevDependencies:** @repo/eslint-config, @repo/typescript-config, @types/node, @types/react, @types/react-dom, autoprefixer, eslint, postcss, tailwindcss, typescript

