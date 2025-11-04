const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { resolveWorkspaceDir, restrictFilepath } = require('@src/runtime/runtime.util');

const STATIC_FILES = [
  {
    relativePath: 'package.json',
    content: (name, description) => JSON.stringify({
      name,
      version: '0.1.0',
      private: true,
      description,
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {},
      devDependencies: {
        vite: '^6.3.5',
      },
    }, null, 2),
  },
  {
    relativePath: 'vite.config.js',
    content: () => `import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
  },
});`,
  },
  {
    relativePath: 'src/main.js',
    content: () => `import './styles.css';

document.querySelector('#app').innerHTML = \`
  <main>
    <h1>Welcome to your LemonAI scaffold</h1>
    <p>Edit <code>src/main.js</code> to get started.</p>
  </main>
\`;
`,
  },
  {
    relativePath: 'src/styles.css',
    content: () => `:root {
  font-family: system-ui, sans-serif;
  color: #1a1a19;
  background-color: #fefefe;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #eff6ff, #e9d5ff);
}

main {
  padding: 2rem 3rem;
  border-radius: 24px;
  background: #ffffffcc;
  box-shadow: 0 12px 40px rgba(31, 41, 55, 0.15);
  text-align: center;
}
`,
  },
  {
    relativePath: 'index.html',
    content: (name) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`,
  },
  {
    relativePath: 'README.md',
    content: (name, description) => `# ${name}

${description || 'web-static project scaffolded by LemonAI.'}

## Commands

- \`pnpm install\`
- \`pnpm dev\`
- \`pnpm build\`
- \`pnpm preview\`
`,
  },
];

const BACKEND_FILES = [
  {
    relativePath: 'server/package.json',
    content: (name) => JSON.stringify({
      name: `${name}-server`,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'node index.js',
      },
      dependencies: {
        express: '^4.19.2',
      },
    }, null, 2),
  },
  {
    relativePath: 'server/index.js',
    content: () => `const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(8787, () => {
  console.log('API server ready on http://localhost:8787');
});
`,
  },
  {
    relativePath: 'server/.env.example',
    content: () => `# Copy to .env and provide secrets here
DATABASE_URL=
JWT_SECRET=
`,
  },
  {
    relativePath: 'prisma/schema.prisma',
    content: () => `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  createdAt DateTime @default(now())
}
`,
  },
];

const ensureDirectory = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const writeFileSafely = async (root, fileConfig, projectName, description) => {
  const filePath = path.join(root, fileConfig.relativePath);
  await ensureDirectory(path.dirname(filePath));
  const content = typeof fileConfig.content === 'function'
    ? fileConfig.content(projectName, description)
    : fileConfig.content;
  await fs.writeFile(filePath, content, 'utf8');
};

const scaffoldProject = async (projectRoot, name, description, features) => {
  await ensureDirectory(projectRoot);
  await ensureDirectory(path.join(projectRoot, 'src'));

  for (const file of STATIC_FILES) {
    await writeFileSafely(projectRoot, file, name, description);
  }

  if (features === 'web-db-user') {
    await ensureDirectory(path.join(projectRoot, 'server'));
    await ensureDirectory(path.join(projectRoot, 'prisma'));
    for (const file of BACKEND_FILES) {
      await writeFileSafely(projectRoot, file, name, description);
    }
  }
};

const webdevInitTool = {
  name: 'webdev_init_project',
  description: 'Initialise a new web development project with modern tooling scaffold.',
  params: {
    type: 'object',
    properties: {
      project_name: {
        type: 'string',
        description: 'Directory name for the project.',
      },
      project_title: {
        type: 'string',
        description: 'Human readable title used in generated files.',
      },
      description: {
        type: 'string',
        description: 'Project description recorded in README.',
      },
      features: {
        type: 'string',
        enum: ['web-static', 'web-db-user'],
        description: 'Chosen scaffold preset.',
      },
      brief: {
        type: 'string',
        description: 'Optional narrative describing project goals.',
      },
    },
    required: ['project_name'],
  },
  getActionDescription: async ({ project_name: projectName }) => {
    return `Initialising web project ${projectName}`;
  },
  execute: async (params = {}, uuid = uuidv4(), context = {}) => {
    const { project_name, project_title, description, features = 'web-static' } = params;
    if (!project_name || typeof project_name !== 'string') {
      throw new Error('project_name must be provided as a string.');
    }
    if (!['web-static', 'web-db-user'].includes(features)) {
      throw new Error(`Unsupported features "${features}".`);
    }

    const userId = context.user_id;
    const workspaceDir = await resolveWorkspaceDir(userId);
    const targetRoot = await restrictFilepath(path.join(workspaceDir, project_name), userId);

    try {
      await fs.access(targetRoot);
      throw new Error(`Project directory ${project_name} already exists.`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await scaffoldProject(targetRoot, project_title || project_name, description, features);

    const summary = [
      `Created project ${project_name} using ${features} preset.`,
      `Location: ${targetRoot}`,
      description ? `Description: ${description}` : null,
    ].filter(Boolean).join('\n');

    return {
      content: summary,
      meta: {
        json: [{
          project_name,
          project_title: project_title || project_name,
          features,
          path: targetRoot,
        }],
      },
    };
  },
};

module.exports = webdevInitTool;
