const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const adminEnvPath = path.join(rootDir, 'apps', 'admin', '.env');
const rootEnvPath = path.join(rootDir, '.env');

// Clean, dependency-free .env reader
const targetEnv = fs.existsSync(adminEnvPath) ? adminEnvPath : (fs.existsSync(rootEnvPath) ? rootEnvPath : null);
if (targetEnv) {
    const envFile = fs.readFileSync(targetEnv, 'utf8');
    const dbLine = envFile.split('\n').find(line => line.startsWith('DATABASE_URL='));
    if (dbLine) {
        process.env.DATABASE_URL = dbLine.replace('DATABASE_URL=', '').replace(/['"]/g, '').trim();
    }
}

let mysql;
try {
    mysql = require('mysql2/promise');
} catch {
    mysql = null;
}

const docsDir = path.join(rootDir, 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

const ignoreDirs = ['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'docs'];

// ==========================================
// 1. DATABASE MAPPER (Live DB + Drizzle Schema)
// ==========================================
async function generateDatabaseMap() {
    console.log('\n🗄️  Extracting Database Schema...');
    let mdOutput = '# Database Map (SaaS Commerce)\n\n';
    let sqlOutput = `-- SaaS Commerce SQL Schema\n-- Generated on: ${new Date().toISOString()}\n\n`;

    const dbUrl = process.env.DATABASE_URL;

    if (mysql && dbUrl) {
        try {
            const connection = await mysql.createConnection(dbUrl);
            const [tables] = await connection.execute('SHOW TABLES');

            for (const tableRow of tables) {
                const tableName = Object.values(tableRow)[0];
                const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
                sqlOutput += `${createTable[0]['Create Table']};\n\n`;

                mdOutput += `## Table: \`${tableName}\`\n`;
                const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
                mdOutput += `| Column | Type | Null | Key | Default |\n|---|---|---|---|---|\n`;
                for (const col of columns) {
                    mdOutput += `| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'} |\n`;
                }
                mdOutput += `\n`;
            }

            fs.writeFileSync(path.join(docsDir, 'SCHEMA.sql'), sqlOutput);
            await connection.end();
            console.log('✅ Live MySQL schema extracted.');
        } catch (err) {
            console.warn(`⚠️ Could not read live MySQL (${err.message}). Falling back to schema files.`);
        }
    }

    // Also extract raw schema.ts files from packages/db
    const schemaDir = path.join(rootDir, 'packages', 'db', 'src');
    if (fs.existsSync(schemaDir)) {
        mdOutput += `\n# Drizzle ORM Schema Files (packages/db)\n\n`;
        function readDirTs(dir) {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    readDirTs(fullPath);
                } else if (item.name.endsWith('.ts')) {
                    const relative = fullPath.replace(rootDir, '').replace(/\\/g, '/');
                    mdOutput += `### File: \`${relative}\`\n\`\`\`typescript\n${fs.readFileSync(fullPath, 'utf8')}\n\`\`\`\n\n`;
                }
            }
        }
        readDirTs(schemaDir);
    }

    fs.writeFileSync(path.join(docsDir, 'BACKEND_CONTEXT_DB.md'), mdOutput);
    console.log('✅ Database documentation saved in /docs.');
}

// ==========================================
// 2. MONOREPO STRUCTURE & WORKSPACES
// ==========================================
function generateMonorepoMap() {
    console.log('🗺️  Mapping Monorepo folder tree and packages...');
    let mapContent = '# SaaS Commerce Monorepo Structure\n\n```text\nsaas-commerce\n';

    function generateTree(dir, prefix = '', depth = 0) {
        if (!fs.existsSync(dir) || depth > 5) return;
        const items = fs.readdirSync(dir, { withFileTypes: true })
            .filter(item => !ignoreDirs.includes(item.name));

        items.forEach((item, index) => {
            const isLast = index === items.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            mapContent += `${prefix}${connector}${item.name}\n`;

            if (item.isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                generateTree(path.join(dir, item.name), newPrefix, depth + 1);
            }
        });
    }

    generateTree(rootDir);
    mapContent += '```\n\n';

    // Map workspace package.json files
    mapContent += '## Workspace Packages & Dependencies\n\n';
    ['packages', 'apps'].forEach(folder => {
        const target = path.join(rootDir, folder);
        if (fs.existsSync(target)) {
            const subs = fs.readdirSync(target, { withFileTypes: true });
            for (const sub of subs) {
                if (sub.isDirectory()) {
                    const pkgJson = path.join(target, sub.name, 'package.json');
                    if (fs.existsSync(pkgJson)) {
                        const parsed = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
                        mapContent += `### \`${folder}/${sub.name}\` (${parsed.name || 'unnamed'})\n`;
                        mapContent += `- **Dependencies:** ${Object.keys(parsed.dependencies || {}).join(', ') || 'None'}\n`;
                        mapContent += `- **DevDependencies:** ${Object.keys(parsed.devDependencies || {}).join(', ') || 'None'}\n\n`;
                    }
                }
            }
        }
    });

    fs.writeFileSync(path.join(docsDir, 'MONOREPO_MAP.md'), mapContent);
    console.log('✅ Monorepo map saved.');
}

// ==========================================
// 3. API ROUTES & SERVER ACTIONS (apps/admin)
// ==========================================
function generateApiContext() {
    console.log('🔍 Gathering API routes & Server Actions...');
    let apiDoc = '# SaaS Commerce Admin API & Server Actions\n\n';

    const adminAppDir = path.join(rootDir, 'apps', 'admin', 'src', 'app');
    if (!fs.existsSync(adminAppDir)) {
        console.warn('⚠️ apps/admin/src/app not found, skipping route extraction.');
        return;
    }

    function scanRoutes(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scanRoutes(fullPath);
            } else if (item.name === 'route.ts' || item.name === 'route.js') {
                const relative = fullPath.replace(rootDir, '').replace(/\\/g, '/');
                apiDoc += `## Route Endpoint: \`${relative.replace('/apps/admin/src/app', '').replace(/\/route\.(ts|js)/, '')}\`\n`;
                apiDoc += `*File: \`${relative}\`*\n\n\`\`\`typescript\n${fs.readFileSync(fullPath, 'utf8')}\n\`\`\`\n\n`;
            } else if (item.name === 'actions.ts' || item.name === 'actions.js') {
                const relative = fullPath.replace(rootDir, '').replace(/\\/g, '/');
                apiDoc += `## Server Actions: \`${relative}\`\n\n\`\`\`typescript\n${fs.readFileSync(fullPath, 'utf8')}\n\`\`\`\n\n`;
            }
        }
    }

    scanRoutes(adminAppDir);
    fs.writeFileSync(path.join(docsDir, 'BACKEND_CONTEXT_API.md'), apiDoc);
    console.log('✅ API context saved.');
}

// ==========================================
// 4. SHARED PACKAGES CONTEXT (packages/*)
// ==========================================
function generatePackagesContext() {
    console.log('📦 Gathering packages/* (db, ui, config)...');
    let pkgDoc = '# SaaS Commerce Shared Packages Context\n\n';

    const packagesDir = path.join(rootDir, 'packages');
    if (!fs.existsSync(packagesDir)) return;

    function scanFiles(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (ignoreDirs.includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scanFiles(fullPath);
            } else if (/\.(ts|tsx|json|js)$/.test(item.name) && !item.name.endsWith('.lock')) {
                const relative = fullPath.replace(rootDir, '').replace(/\\/g, '/');
                pkgDoc += `### \`${relative}\`\n\`\`\`${item.name.endsWith('.json') ? 'json' : 'typescript'}\n${fs.readFileSync(fullPath, 'utf8')}\n\`\`\`\n\n`;
            }
        }
    }

    scanFiles(packagesDir);
    fs.writeFileSync(path.join(docsDir, 'PACKAGES_CONTEXT.md'), pkgDoc);
    console.log('✅ Packages context saved.');
}

// ==========================================
// 5. MASTER AI HANDOFF (Single Comprehensive File)
// ==========================================
function generateMasterAiPrompt() {
    console.log('🤖 Generating MASTER_AI_CONTEXT.md...');

    const dbMapPath = path.join(docsDir, 'BACKEND_CONTEXT_DB.md');
    const apiPath = path.join(docsDir, 'BACKEND_CONTEXT_API.md');
    const repoMapPath = path.join(docsDir, 'MONOREPO_MAP.md');

    let master = `# SAAS-COMMERCE SYSTEM ARCHITECTURE & AI HANDOFF

> **For the AI:** This document contains the full architecture, schema, workspace arrangement, and API layer for the \`saas-commerce\` project. Read this to understand the backend system before proposing any database mutations, migrations, or route implementations.

---

## 1. Monorepo Overview
- **Package Manager:** pnpm workspaces
- **Apps:**
  - \`apps/admin\`: Next.js admin dashboard and backend API server (runs on \`http://localhost:3000\`).
- **Storefront:**
  - \`the-colour-world\`: Independent Next.js app located outside the monorepo in \`../the-colour-world\` (runs on \`http://localhost:3001\`) and consumes this backend over HTTP.
- **Packages:**
  - \`packages/db\`: Drizzle ORM schema definitions and database client instance.
  - \`packages/ui\`: Shared UI components.
  - \`packages/eslint-config\` & \`packages/typescript-config\`: Shared configurations.

---

## 2. Directory & Workspace Tree
${fs.existsSync(repoMapPath) ? fs.readFileSync(repoMapPath, 'utf8') : 'See MONOREPO_MAP.md'}

---

## 3. Database Schema
${fs.existsSync(dbMapPath) ? fs.readFileSync(dbMapPath, 'utf8') : 'See BACKEND_CONTEXT_DB.md'}

---

## 4. API & Server Actions
${fs.existsSync(apiPath) ? fs.readFileSync(apiPath, 'utf8') : 'See BACKEND_CONTEXT_API.md'}
`;

    fs.writeFileSync(path.join(docsDir, 'MASTER_AI_CONTEXT.md'), master);
    console.log('✅ MASTER_AI_CONTEXT.md generated successfully!');
}

// ==========================================
// RUN SCRIPT
// ==========================================
async function run() {
    console.log('🚀 Running SaaS-Commerce System Mapper...');
    await generateDatabaseMap();
    generateMonorepoMap();
    generateApiContext();
    generatePackagesContext();
    generateMasterAiPrompt();
    console.log('\n🎉 Finished! Open the `docs/` folder to view your generated files.');
}

run();