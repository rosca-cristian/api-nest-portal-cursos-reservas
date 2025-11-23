# GestionCursos & SpaceFlow API

A comprehensive backend API built with NestJS that combines **course management** and **space reservation systems**. This application provides a complete solution for educational institutions to manage courses, enrollments, certificates, and facility space bookings.

## Features

### Course Management System
- User authentication and authorization (JWT-based)
- Role-based access control (Student, Instructor, Admin)
- Course creation and management
- Student enrollments and tracking
- Certificate generation for completed courses
- User profile management

### Space Reservation System
- Multi-floor facility management
- Individual desk and group room reservations
- Real-time availability tracking
- Reservation management with participant invitations
- Admin controls for space maintenance
- Comprehensive audit logging

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Password Hashing**: bcrypt

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd api-cursos-reservas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3000
```

**Important**: Change the `JWT_SECRET` in production environments.

### 4. Run Prisma migrations

Generate the Prisma client and run all migrations:

```bash
npx prisma migrate dev
```

This command will:
- Create the SQLite database file
- Run all pending migrations
- Generate the Prisma client

Alternative commands:
```bash
# Generate Prisma client only
npx prisma generate

# Reset database (drops all data and re-runs migrations)
npx prisma migrate reset

# Deploy migrations in production
npx prisma migrate deploy
```

### 5. Seed the database

Populate the database with demo data:

```bash
npx prisma db seed
```

This will create:
- **16 Users**:
  - 10 Students (juanperez@demo.com, mariagarcia@demo.com, etc.)
  - 5 Faculty members (juanfaculty@demo.com, mariafaculty@demo.com, etc.)
  - 1 Admin (admin@demo.com)
- **40 Courses**: 20 programming courses + 20 AI/ML courses
- **Multiple enrollments** for each student (both active and completed)
- **4 Library floors** with 48 spaces (12 spaces per floor)
- **195 Reservations** across all users

All demo accounts use the password: **`password`**

### 6. Start the application

Development mode (with hot reload):
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

Debug mode:
```bash
npm run start:debug
```

## API Documentation

Once the application is running, access the interactive Swagger documentation:

```
http://localhost:3000/api/docs
```

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive API testing
- Authentication support (Bearer JWT)

## Demo Credentials

Use these credentials to test the application:

### Students
- **Email**: juanperez@demo.com | **Password**: password
- **Email**: mariagarcia@demo.com | **Password**: password
- **Email**: carloslopez@demo.com | **Password**: password

### Faculty
- **Email**: juanfaculty@demo.com | **Password**: password
- **Email**: mariafaculty@demo.com | **Password**: password

### Admin
- **Email**: admin@demo.com | **Password**: password

## Available Scripts

```bash
# Development
npm run start          # Start application
npm run start:dev      # Start with hot reload
npm run start:debug    # Start in debug mode

# Building
npm run build          # Build for production

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests

# Code Quality
npm run lint           # Lint code
npm run format         # Format code with Prettier

# Database
npx prisma migrate dev       # Run migrations in dev
npx prisma migrate reset     # Reset database
npx prisma db seed          # Seed database with demo data
npx prisma studio           # Open Prisma Studio (DB GUI)
npx prisma generate         # Generate Prisma client
```

## Database Schema

The application uses Prisma with SQLite. Key models include:

- **User**: Students, instructors, and administrators
- **Course**: Course catalog with descriptions and durations
- **Enrollment**: Student course enrollments and completion tracking
- **Certificate**: Auto-generated certificates for completed courses
- **Floor**: Building floor layouts
- **Space**: Individual desks and group rooms
- **Reservation**: Space bookings with time slots
- **Participant**: Multi-user reservations
- **AuditLogEntry**: Comprehensive activity logging

## Project Structure

```
api-cursos-reservas/
├── prisma/
│   ├── migrations/        # Database migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding script
├── src/
│   ├── admin/            # Admin management endpoints
│   ├── auth/             # Authentication & authorization
│   ├── audit/            # Audit logging service
│   ├── certificates/     # Certificate generation
│   ├── courses/          # Course management
│   ├── enrollments/      # Enrollment handling
│   ├── floors/           # Floor management
│   ├── invitations/      # Reservation invitations
│   ├── reservations/     # Space reservation system
│   ├── spaces/           # Space management
│   ├── users/            # User management
│   ├── prisma/           # Prisma service
│   ├── common/           # Shared utilities
│   └── main.ts           # Application entry point
├── test/                 # E2E tests
└── package.json
```

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile

### Courses
- `GET /api/courses` - List all courses (with filters)
- `POST /api/courses` - Create new course (Instructor/Admin)
- `GET /api/courses/:id` - Get course details
- `PATCH /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `POST /api/enrollments` - Enroll in a course
- `GET /api/enrollments/my-courses` - Get user's enrollments
- `PATCH /api/enrollments/:id/complete` - Mark course as completed

### Spaces & Reservations
- `GET /api/floors` - List all floors
- `GET /api/spaces` - List available spaces
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - List user's reservations
- `DELETE /api/reservations/:id` - Cancel reservation

### Admin
- `POST /api/admin/floors` - Create floor
- `POST /api/admin/spaces` - Create space
- `PATCH /api/admin/spaces/:id/unavailable` - Mark space unavailable
- `GET /api/admin/audit-logs` - View audit logs

## Prisma Database Commands

### Migrations

```bash
# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Database Management

```bash
# Seed database with demo data
npx prisma db seed

# Push schema changes without migration (dev only)
npx prisma db push

# Open Prisma Studio (visual database editor)
npx prisma studio

# Validate Prisma schema
npx prisma validate

# Format Prisma schema
npx prisma format
```

### Prisma Client

```bash
# Generate Prisma Client
npx prisma generate

# Generate with custom output
npx prisma generate --schema=./prisma/schema.prisma
```

## Development Workflow

1. Make changes to `prisma/schema.prisma`
2. Create a migration: `npx prisma migrate dev --name describe_your_changes`
3. The Prisma client will be automatically regenerated
4. Update your TypeScript code to use the new schema
5. Test your changes with `npm run test`

## Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Database Lock Errors
```bash
# Stop all running instances of the app
# Then reset the database
npx prisma migrate reset
```

### Migration Conflicts
```bash
# Check migration status
npx prisma migrate status

# If needed, reset and reseed
npx prisma migrate reset
npx prisma db seed
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database file path | `file:./dev.db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-change-in-production` |
| `PORT` | Application port | `3000` |

## Testing

Run the test suite:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment to Render

This application is configured for easy deployment to Render.com with PostgreSQL database.

### Prerequisites

1. A GitHub account
2. A Render account (free tier available at https://render.com)
3. Git installed locally

### Step 1: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: API Cursos y Reservas"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Go to https://render.com and sign in
2. Click on "New +" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Review the configuration and click "Apply"
6. Wait for the deployment to complete (5-10 minutes)

#### Option B: Manual Setup

1. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `cursos-reservas-db`
   - Region: Choose closest to your users
   - Plan: Free
   - Click "Create Database"
   - Copy the **Internal Database URL**

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `api-cursos-reservas`
     - **Region:** Same as database
     - **Branch:** `main`
     - **Root Directory:** Leave empty
     - **Runtime:** Node
     - **Build Command:** `npm install && npx prisma generate && npm run build`
     - **Start Command:** `npx prisma migrate deploy && npm run start:prod`

3. **Add Environment Variables:**
   - Click "Environment" tab
   - Add the following variables:
     ```
     NODE_ENV=production
     DATABASE_URL=<paste-your-postgres-internal-url>
     JWT_SECRET=<generate-secure-random-string>
     PORT=3000
     ```

   To generate a secure JWT_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your API will be available at: `https://YOUR_APP_NAME.onrender.com`

### Step 3: Seed Database (Optional)

After first deployment, you can seed the database with demo data:

1. Go to your Render web service dashboard
2. Click on "Shell" tab
3. Run: `npx prisma db seed`

This will populate your database with:
- 16 demo users (students, faculty, admin)
- 40 courses
- Sample enrollments and reservations

### Step 4: Test Your API

1. Visit your API documentation: `https://YOUR_APP_NAME.onrender.com/api/docs`
2. Test the login endpoint with demo credentials:
   - Email: `admin@demo.com`
   - Password: `password`
3. Use the JWT token to test protected endpoints

### Important Notes for Production

1. **Database Migrations:** Migrations run automatically on each deployment via `npx prisma migrate deploy`

2. **Environment Variables:** Never commit `.env` file to GitHub. Always use Render's environment variable settings.

3. **Free Tier Limitations:**
   - Render free tier spins down after 15 minutes of inactivity
   - First request after spin-down may take 30-60 seconds
   - Database has 256MB storage limit
   - Consider upgrading for production use

4. **Database Backups:** Enable automatic backups in Render dashboard (available on paid plans)

5. **Monitoring:** Check Render logs for errors: Dashboard → Logs tab

### Updating Your Deployment

To deploy updates:

```bash
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main
```

Render will automatically detect the push and redeploy your application.

### Switching Between SQLite (Dev) and PostgreSQL (Production)

The application is now configured for PostgreSQL. If you want to use SQLite for local development:

1. In `prisma/schema.prisma`, temporarily change:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. In `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

Remember to change back to PostgreSQL before pushing to production.

### Troubleshooting

**Build fails on Render:**
- Check that `package.json` has all required dependencies
- Verify Node version compatibility
- Check Render logs for specific error messages

**Database connection fails:**
- Verify DATABASE_URL is correct
- Ensure database and web service are in same region
- Check that database is not paused (free tier)

**Migrations fail:**
- Check that Prisma schema is valid: `npx prisma validate`
- Ensure database is accessible
- Try resetting database (WARNING: deletes all data)

**API returns 502/503:**
- Free tier may be spinning up (wait 30-60 seconds)
- Check application logs in Render dashboard
- Verify health check endpoint is responding

## License

UNLICENSED - Private project

## Support

For issues and questions, please open an issue in the repository.

## Author

Built with NestJS, Prisma, and PostgreSQL.
