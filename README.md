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

### Frontend (Coming Soon)
- React 18 + TypeScript
- Vite
- TanStack Query
- Tailwind CSS + shadcn/ui
- Recharts

## Getting Started

### Prerequisites
- Java 17+
- PostgreSQL 14+
- Maven 3.8+

### Database Setup
```sql
CREATE DATABASE finance_tracker;
```

### Configuration
Create `application-local.yml` in `backend/src/main/resources/`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/finance_tracker
    username: your_username
    password: your_password

jwt:
  secret: your-256-bit-secret-key-here
```

### Run Backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### API Documentation
Once running, access Swagger UI at: `http://localhost:8080/swagger-ui.html`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/{id}` - Get account
- `PUT /api/accounts/{id}` - Update account
- `DELETE /api/accounts/{id}` - Delete account

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/type/{type}` - List by type (INCOME/EXPENSE)
- `POST /api/categories` - Create custom category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Transactions
- `GET /api/transactions` - List with pagination
- `GET /api/transactions/range` - List by date range
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

### Budgets
- `GET /api/budgets` - List all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget

### Dashboard
- `GET /api/dashboard/summary` - Financial summary
- `GET /api/dashboard/cashflow` - Cash flow report
- `GET /api/dashboard/by-category` - Spending by category

## Project Structure

```
finance-tracker/
├── backend/
│   ├── src/main/java/com/financetracker/
│   │   ├── config/          # Configuration classes
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Data transfer objects
│   │   ├── entity/          # JPA entities
│   │   ├── exception/       # Exception handling
│   │   ├── repository/      # Data repositories
│   │   ├── security/        # JWT & Security
│   │   └── service/         # Business logic
│   └── src/main/resources/
│       ├── db/migration/    # Flyway migrations
│       └── application.yml
└── frontend/                # React frontend (coming soon)
```

## License

MIT
