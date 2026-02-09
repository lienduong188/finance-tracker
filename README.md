# Finance Tracker

A personal finance management application to help individuals and families track their financial situation clearly and systematically.

## Features

### Core
- **Account Management**: Track multiple money sources (cash, bank accounts, e-wallets, credit cards)
- **Transaction Tracking**: Record income, expenses, and transfers between accounts
- **Budget Management**: Set spending limits by category with alerts
- **Credit Card Installments (分割・リボ払い)**: Split credit card purchases into installment or revolving payments
- **Multi-Currency Support**: Handle transactions in multiple currencies (VND, JPY)

### Planning
- **Recurring Transactions**: Automate regular income/expenses (daily, weekly, monthly, yearly)
- **Savings Goals**: Set and track personal or group savings targets
- **Debts Tracking**: Manage money lent and borrowed with payment history
- **Spending Plans**: Plan and track expenses for events (trips, weddings, birthdays) with estimated vs actual comparison

### Collaboration
- **Family/Group Management**: Share finances with family or friends
- **Group Invitations**: Invite members to join groups
- **Shared Savings Goals**: Create savings goals that multiple members can contribute to

### User Experience
- **Dashboard**: Visual overview with cash flow charts and spending by category
- **Dark Mode**: Light, Dark, and System theme options
- **Multi-language**: Vietnamese, English, and Japanese (i18n)
- **AI Chat Assistant**: Ask questions about your finances
- **Notifications**: Budget warnings, debt reminders, group invitations
- **Account Deletion (退会)**: Request account deletion with 7-day grace period for restoration

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
- TanStack Query (React Query)
- Tailwind CSS v4
- Recharts
- react-i18next
- React Hook Form + Zod

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
   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD (auto from Railway PostgreSQL)
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
│   │   ├── context/         # React contexts (Auth, Theme)
│   │   ├── pages/           # Page components
│   │   ├── i18n/            # Translations (vi, en, ja)
│   │   ├── types/           # TypeScript types
│   │   └── lib/             # Utilities
│   ├── Dockerfile
│   └── vercel.json
│
└── docker-compose.yml       # Local development
```

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
| `/api/recurring` | GET/POST | List/Create recurring transactions |
| `/api/debts` | GET/POST | List/Create debts |
| `/api/credit-card-plans` | GET/POST | List/Create credit card payment plans |
| `/api/families` | GET/POST | List/Create family groups |
| `/api/savings-goals` | GET/POST | List/Create savings goals |
| `/api/categories` | GET | List categories |
| `/api/dashboard/summary` | GET | Financial summary |

## License

MIT
