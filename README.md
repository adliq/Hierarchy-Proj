# Hierarchy

### A full-stack platform for sharing ideas and connecting with potential collaborators

Hierarchy helps individuals develop ideas and share them with businesses. Users can plan a concept, publish an idea, explore submissions, complete an NDA-signing workflow, and discuss opportunities through in-app messaging.

Built as a personal project, Hierarchy brings together a **React frontend**, a **Node.js and Express API**, and **MongoDB persistence**. It demonstrates end-to-end application development across user interfaces, authentication, database modeling, file uploads, and collaboration workflows.

## Features

- **Individual and business accounts** — Registration, email verification, login, and password reset flows, with industry information for business profiles.
- **Idea sharing** — Submit ideas with a title, summary, detailed description, category, tags, attachments, and industry visibility options.
- **Idea Planner** — Organize a problem, proposed solution, goals, and custom information; save drafts for later.
- **Cost estimation** — Build an itemized cost estimate with browser-local persistence.
- **NDA workflow** — Record disclosing-party information and receiving-party signatures, and check signing status when viewing an idea's details.
- **In-app messaging** — Exchange messages in conversations associated with an NDA. The chat view refreshes messages every four seconds.
- **Profiles and discovery** — Customize profile and cover images, bio, and social links; search for users and ideas and save favorite ideas.
- **Display preferences** — Switch between light and dark themes.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios, CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcrypt |
| File uploads | Multer with local disk storage |
| Email | Nodemailer with Gmail transport |

The application is primarily written in JavaScript and JSX. Tailwind CSS packages are included in the project dependencies, and several pages use utility classes.

## How it works

```text
React frontend
      |
      | HTTP requests to /api/*
      v
Express API
      |-- JWT authentication and application routes
      |-- Mongoose models --> MongoDB
      |-- Multer uploads --> local uploads/ directory
      `-- Nodemailer --> verification and password-reset emails
```

The frontend and backend run separately during local development. MongoDB stores users, ideas, drafts, NDA records, and messages. Uploaded files are stored on the backend's filesystem.

## Run locally

### Prerequisites

- Node.js 22 and npm. The included Replit configuration uses Node.js 22.
- A running MongoDB instance, either local or hosted.
- Gmail credentials accepted by the configured Nodemailer transport to exercise email verification and password-reset flows.

### 1. Install dependencies

From the repository root:

```bash
npm ci
cd frontend
npm ci
cd ..
```

### 2. Configure the backend

Create a `.env` file in the repository root:

```dotenv
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/hierarchy
JWT_SECRET=replace-with-a-long-random-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=replace-with-your-mail-credential
NODE_ENV=development
```

Use your own MongoDB connection string if you are using a hosted database. Keep `.env` out of version control; an `.env.example` should contain placeholders only.

Email verification is required before login. If email sending fails during signup, the account may still be created, but verification must be completed before signing in.

### 3. Start the backend

In a terminal at the repository root:

```bash
node index.js
```

The API runs at `http://localhost:3000`. The backend creates the `uploads/` directory if it does not already exist.

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, typically `http://localhost:5173`.

Frontend API requests currently use `http://localhost:3000`, so retain that backend port for local development. Changing the host or port also requires updating the frontend API URLs.

## Explore the application

1. Register an individual account and verify it using the emailed code.
2. Customize the profile and use the Idea Planner to save a draft.
3. Submit an idea with a summary, detailed description, and NDA information.
4. Register and verify a second, business account with an appropriate industry.
5. Browse ideas, complete the receiving-party signing flow, and explore the associated chat conversation.

Use sample ideas and files when demonstrating the prototype.

## Project structure

```text
Hierarchy/
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared UI and layout components
│   │   ├── pages/          # Accounts, ideas, drafts, chat, and settings
│   │   └── App.jsx         # Client-side routes
│   └── vite.config.js
├── Controller/            # Chat, NDA, and settings logic
├── middleware/            # JWT verification and upload configuration
├── models/                # User, Idea, Draft, Message, and NDA schemas
├── routes/                # Express API routes
├── utils/                 # Email delivery helper
├── uploads/               # Local uploaded files
├── index.js               # Backend entry point
└── package.json
```

## Development commands

Run these commands from `frontend/`:

```bash
npm run lint       # Check frontend code with ESLint
npm run build      # Generate the frontend production build
npm run preview    # Preview that build locally
```

The root `npm test` command is a placeholder; the repository does not currently include an automated test suite. The frontend build does not package or start the backend.

## Prototype status and next steps

Hierarchy is a functional prototype with opportunities to improve deployment, testing, and access control:

- Centralize frontend API configuration instead of using hard-coded local URLs.
- Add automated tests for account, idea, NDA, and messaging workflows.
- Harden authorization across idea lists, user routes, development endpoints, and file downloads. The backend currently serves `uploads/` publicly, and the idea-list endpoint returns full idea documents; the NDA workflow therefore does not yet provide comprehensive protection for confidential content.
- Move uploads to managed storage and add file-size limits.
- Replace chat polling with push-based updates as the application evolves.

## Author

**Adli Qanadilo**

- [Portfolio](https://www.adliqanadilo.website)
- [LinkedIn](https://www.linkedin.com/in/adliqanadilo)
