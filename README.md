# Finance Tracker

A personal finance management application to help individuals and families track their financial situation clearly and systematically.

## Features

- **Account Management**: Track multiple money sources (cash, bank accounts, e-wallets, credit cards)
- **Transaction Tracking**: Record income, expenses, and transfers between accounts
- **Budget Management**: Set spending limits by category with alerts
- **Multi-Currency Support**: Handle transactions in multiple currencies (VND, USD, EUR, etc.)
- **Dashboard**: Visual overview of financial status, cash flow, and spending by category

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2
- Spring Security + JWT Authentication
- Spring Data JPA
- PostgreSQL
- Flyway (Database migrations)
- OpenAPI/Swagger

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- Recharts

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/lienduong188/finance-tracker.git
cd finance-tracker

# Start all services
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

## Local Development

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+

### Backend Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE finance_tracker;"

# Copy environment file
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Run backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## Deployment

### Deploy Backend to Railway

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL database from Railway's template
3. Connect your GitHub repository
4. Set root directory to `/backend`
5. Add environment variables:
   ```
   DATABASE_URL=<from Railway PostgreSQL>
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=<from Railway>
   JWT_SECRET=<generate a 32+ char secret>
   SPRING_PROFILES_ACTIVE=prod
   ```
6. Deploy!

### Deploy Frontend to Vercel

1. Import project on [Vercel](https://vercel.com)
2. Set root directory to `/frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend.up.railway.app/api
   ```
4. Deploy!

### Environment Variables

#### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection URL | jdbc:postgresql://localhost:5432/finance_tracker |
| DATABASE_USERNAME | Database username | postgres |
| DATABASE_PASSWORD | Database password | your_password |
| JWT_SECRET | Secret key for JWT (min 32 chars) | your-super-secret-key-here |
| JWT_EXPIRATION | Access token expiry (ms) | 86400000 (24h) |
| PORT | Server port | 8080 |

#### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:8080/api |

## API Documentation

Once running, access Swagger UI at: `http://localhost:8080/swagger-ui.html`

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login |
| `/api/accounts` | GET/POST | List/Create accounts |
| `/api/transactions` | GET/POST | List/Create transactions |
| `/api/budgets` | GET/POST | List/Create budgets |
| `/api/categories` | GET | List categories |
| `/api/dashboard/summary` | GET | Financial summary |

## Project Structure

```
finance-tracker/
├── backend/
│   ├── src/main/java/com/financetracker/
│   │   ├── config/          # Configuration
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Data transfer objects
│   │   ├── entity/          # JPA entities
│   │   ├── exception/       # Exception handling
│   │   ├── repository/      # Data repositories
│   │   ├── security/        # JWT & Security
│   │   └── service/         # Business logic
│   ├── src/main/resources/
│   │   ├── db/migration/    # Flyway migrations
│   │   └── application.yml
│   ├── Dockerfile
│   └── railway.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API clients
│   │   ├── components/      # UI components
│   │   ├── context/         # React contexts
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript types
│   │   └── lib/             # Utilities
│   ├── Dockerfile
│   └── vercel.json
│
└── docker-compose.yml       # Local development
```

## Screenshots

Coming soon...

## License

MIT
