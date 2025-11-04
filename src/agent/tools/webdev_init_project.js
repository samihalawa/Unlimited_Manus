/**
 * Web development project initialization tool
 * Presets: web-static (static HTML/CSS/JS), web-db-user (full-stack with DB and auth)
 */

const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

const WebdevInitProject = {
  name: "webdev_init_project",
  description: "Initialize a web development project with scaffolding. Presets: 'web-static' for static HTML/CSS/JS site, 'web-db-user' for full-stack app with database, server, and authentication.",
  params: {
    type: "object",
    properties: {
      brief: {
        description: "A one-sentence description of the project initialization purpose",
        type: "string"
      },
      description: {
        description: "Description of the web project to be created (will be used as project description)",
        type: "string"
      },
      features: {
        description: "Initial capability preset for the project.",
        type: "string",
        enum: ["web-static", "web-db-user"]
      },
      project_name: {
        description: "Name of the web project to be created (will be used as directory name)",
        type: "string"
      },
      project_title: {
        description: "Title of the web project to be created (will be used as project title)",
        type: "string"
      }
    },
    required: ["features", "project_name"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { features, project_name, brief } = args;
    if (brief) return brief;
    return `Initializing ${features} project: ${project_name}`;
  },
  
  async execute(args, uuid, context) {
    const { features, project_name, project_title, description } = args;
    const preset = features; // Use features as preset for internal logic
    
    try {
      // Determine project directory
      const workspaceDir = context.workspace_dir || process.cwd();
      const projectDir = path.join(workspaceDir, 'project', project_name);
      
      // Check if directory already exists
      if (existsSync(projectDir)) {
        return {
          status: 'failure',
          content: `Project directory already exists: ${projectDir}`,
          meta: { action_type: 'webdev_init_project' }
        };
      }
      
      // Create project directory
      await fs.mkdir(projectDir, { recursive: true });
      
      if (preset === 'web-static') {
        await initStaticProject(projectDir, project_name);
      } else if (preset === 'web-db-user') {
        await initFullStackProject(projectDir, project_name);
      } else {
        return {
          status: 'failure',
          content: `Unknown preset: ${preset}`,
          meta: { action_type: 'webdev_init_project' }
        };
      }
      
      return {
        status: 'success',
        content: `Project initialized: ${project_name}\nLocation: ${projectDir}\nPreset: ${preset}`,
        meta: {
          action_type: 'webdev_init_project',
          preset,
          project_name,
          project_dir: projectDir,
          json: { name: project_name, path: projectDir, preset }
        }
      };
    } catch (error) {
      console.error('Webdev init project error:', error);
      return {
        status: 'failure',
        content: `Project initialization failed: ${error.message}`,
        meta: { action_type: 'webdev_init_project' }
      };
    }
  }
};

/**
 * Initialize static web project
 */
async function initStaticProject(projectDir, projectName) {
  // Create directory structure
  await fs.mkdir(path.join(projectDir, 'css'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'js'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'images'), { recursive: true });
  
  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <h1>${projectName}</h1>
    </header>
    <main>
        <section>
            <h2>Welcome</h2>
            <p>This is a static web project.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 ${projectName}</p>
    </footer>
    <script src="js/app.js"></script>
</body>
</html>`;
  
  // Create style.css
  const styleCss = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: #667eea;
    color: white;
    padding: 2rem;
    text-align: center;
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

section {
    margin-bottom: 2rem;
}

h2 {
    color: #667eea;
    margin-bottom: 1rem;
}

footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 1rem;
    margin-top: 2rem;
}`;
  
  // Create app.js
  const appJs = `// ${projectName} Application
console.log('${projectName} loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
});`;
  
  // Create README.md
  const readme = `# ${projectName}

A static web project.

## Structure

- \`index.html\` - Main HTML file
- \`css/style.css\` - Stylesheet
- \`js/app.js\` - JavaScript application
- \`images/\` - Image assets

## Usage

Open \`index.html\` in a web browser.

To run a local server:
\`\`\`bash
python -m http.server 8000
# or
npx serve .
\`\`\`

Then visit http://localhost:8000
`;
  
  // Write files
  await fs.writeFile(path.join(projectDir, 'index.html'), indexHtml);
  await fs.writeFile(path.join(projectDir, 'css', 'style.css'), styleCss);
  await fs.writeFile(path.join(projectDir, 'js', 'app.js'), appJs);
  await fs.writeFile(path.join(projectDir, 'README.md'), readme);
}

/**
 * Initialize full-stack project with DB and auth
 */
async function initFullStackProject(projectDir, projectName) {
  // Create directory structure
  await fs.mkdir(path.join(projectDir, 'server'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'server', 'models'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'server', 'routes'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'client'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'client', 'css'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'client', 'js'), { recursive: true });
  
  // Create package.json
  const packageJson = {
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: "1.0.0",
    description: "Full-stack web application with database and authentication",
    main: "server/index.js",
    scripts: {
      start: "node server/index.js",
      dev: "nodemon server/index.js"
    },
    dependencies: {
      "express": "^4.18.0",
      "sqlite3": "^5.1.0",
      "bcrypt": "^5.1.0",
      "jsonwebtoken": "^9.0.0",
      "dotenv": "^16.0.0"
    },
    devDependencies: {
      "nodemon": "^3.0.0"
    }
  };
  
  // Create server/index.js
  const serverIndex = `const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});

module.exports = app;`;
  
  // Create server/models/User.js
  const userModel = `const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../database.db'));

// Initialize database
db.serialize(() => {
    db.run(\`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    \`);
});

module.exports = db;`;
  
  // Create server/routes/auth.js
  const authRoutes = `const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'User already exists' });
                }
                res.json({ message: 'User registered successfully', userId: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    });
});

module.exports = router;`;
  
  // Create client/index.html
  const clientIndex = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>${projectName}</h1>
        </header>
        
        <main id="app">
            <div id="auth-section">
                <div class="auth-form">
                    <h2>Login</h2>
                    <form id="login-form">
                        <input type="text" id="login-username" placeholder="Username" required>
                        <input type="password" id="login-password" placeholder="Password" required>
                        <button type="submit">Login</button>
                    </form>
                    <p>Don't have an account? <a href="#" id="show-register">Register</a></p>
                </div>
                
                <div class="auth-form" id="register-section" style="display: none;">
                    <h2>Register</h2>
                    <form id="register-form">
                        <input type="text" id="register-username" placeholder="Username" required>
                        <input type="email" id="register-email" placeholder="Email" required>
                        <input type="password" id="register-password" placeholder="Password" required>
                        <button type="submit">Register</button>
                    </form>
                    <p>Already have an account? <a href="#" id="show-login">Login</a></p>
                </div>
            </div>
            
            <div id="main-content" style="display: none;">
                <h2>Welcome, <span id="username"></span>!</h2>
                <button id="logout">Logout</button>
            </div>
        </main>
    </div>
    <script src="js/app.js"></script>
</body>
</html>`;
  
  // Create client/css/style.css
  const clientCss = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    background: white;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    padding: 2rem;
    max-width: 500px;
    width: 90%;
}

header {
    text-align: center;
    margin-bottom: 2rem;
}

h1 {
    color: #667eea;
}

.auth-form {
    margin-bottom: 1rem;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

input {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
}

button {
    padding: 0.8rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s;
}

button:hover {
    background: #5568d3;
}

a {
    color: #667eea;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}`;
  
  // Create client/js/app.js
  const clientJs = `// ${projectName} Client Application

let authToken = localStorage.getItem('authToken');
let currentUser = localStorage.getItem('username');

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const registerSection = document.getElementById('register-section');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout');
const usernameSpan = document.getElementById('username');

// Initialize
if (authToken && currentUser) {
    showMainContent();
}

// Event Listeners
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.parentElement.style.display = 'none';
    registerSection.style.display = 'block';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginForm.parentElement.style.display = 'block';
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            authToken = data.token;
            currentUser = data.username;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('username', currentUser);
            showMainContent();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('Login failed');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            registerSection.style.display = 'none';
            loginForm.parentElement.style.display = 'block';
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        alert('Registration failed');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    authToken = null;
    currentUser = null;
    showAuthSection();
});

function showMainContent() {
    authSection.style.display = 'none';
    mainContent.style.display = 'block';
    usernameSpan.textContent = currentUser;
}

function showAuthSection() {
    mainContent.style.display = 'none';
    authSection.style.display = 'block';
    registerSection.style.display = 'none';
    loginForm.parentElement.style.display = 'block';
}`;
  
  // Create README.md
  const readme = `# ${projectName}

A full-stack web application with database and authentication.

## Structure

\`\`\`
${projectName}/
├── server/
│   ├── index.js          # Express server
│   ├── models/
│   │   └── User.js       # User model with SQLite
│   └── routes/
│       └── auth.js       # Authentication routes
├── client/
│   ├── index.html        # Frontend HTML
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── app.js        # Client-side JavaScript
├── package.json
└── README.md
\`\`\`

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the server:
\`\`\`bash
npm start
# or for development with auto-reload:
npm run dev
\`\`\`

3. Open http://localhost:3000 in your browser

## Features

- User registration and login
- JWT-based authentication
- SQLite database
- RESTful API
- Responsive UI

## API Endpoints

- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

## Environment Variables

Create a \`.env\` file:
\`\`\`
JWT_SECRET=your-secret-key-here
PORT=3000
\`\`\`

## Security Note

Change the JWT_SECRET in production and use environment variables!
`;
  
  // Create .env.example
  const envExample = `JWT_SECRET=your-secret-key-change-in-production
PORT=3000`;
  
  // Write all files
  await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  await fs.writeFile(path.join(projectDir, 'server', 'index.js'), serverIndex);
  await fs.writeFile(path.join(projectDir, 'server', 'models', 'User.js'), userModel);
  await fs.writeFile(path.join(projectDir, 'server', 'routes', 'auth.js'), authRoutes);
  await fs.writeFile(path.join(projectDir, 'client', 'index.html'), clientIndex);
  await fs.writeFile(path.join(projectDir, 'client', 'css', 'style.css'), clientCss);
  await fs.writeFile(path.join(projectDir, 'client', 'js', 'app.js'), clientJs);
  await fs.writeFile(path.join(projectDir, 'README.md'), readme);
  await fs.writeFile(path.join(projectDir, '.env.example'), envExample);
}

module.exports = WebdevInitProject;
