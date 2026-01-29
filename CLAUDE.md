# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication & Git Rules

- Giao tiếp bằng tiếng Việt
- Khi commit code, KHÔNG thêm dòng `Co-Authored-By: Claude` vào commit message
- Khi làm xong task thì deploy lên luôn, commit xong sync lên remote luôn
- Khi build lỗi thì hãy xóa commit trước đi, fix lỗi, và commit mới để github k bị bẩn
- Đối với front end nếu thêm tính năng gì mới thì nhớ bổ sung i18n (vi, en, ja). Còn đối với màn admin thì k cần - admin ngôn ngữ chính tiếng việt là được
- Giá tiền của hệ thống luôn hiển thị số nguyên, phân cách đơn vị bằng dấu . hoặc , tùy theo loại tiền tệ. Ví dụ: ￥141,593, 9.135.000 ₫

## Project Overview

Personal finance management application với Spring Boot backend và React frontend. Monorepo structure với `/backend` và `/frontend` directories.

**Live URLs:**
- Frontend: Vercel (auto-deploy từ main branch)
- Backend: Railway (https://finance-tracker-production-73c3.up.railway.app)

**Core Features:**
- Account management (cash, bank, e-wallet, credit card)
- Transaction tracking (income, expense, transfer)
- Budget management với alerts
- Recurring transactions (định kỳ)
- Debts tracking (cho vay/nợ)
- Family/Group management (quản lý nhóm)
- Savings goals (mục tiêu tiết kiệm)
- Multi-currency support (VND, JPY)
- Dashboard with charts (Recharts)
- Dark mode (Light/Dark/System)
- i18n (Vietnamese, English, Japanese)
- AI Chat assistant

## Development Commands

### Backend (Java/Spring Boot)
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev   # Run with dev profile
mvn test                                              # Run all tests
mvn test -Dtest=ClassName                            # Run single test class
mvn clean package -DskipTests                        # Build JAR without tests
```

### Frontend (React/TypeScript)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # TypeScript check + production build
npm run lint         # Run ESLint
```

### Docker (Full Stack)
```bash
docker-compose up -d      # Start PostgreSQL, backend, frontend
docker-compose down       # Stop all services
```

## Architecture

### Backend
Standard Spring Boot layered architecture in `com.financetracker.*`:
- **controller/** - REST endpoints (all prefixed `/api`)
- **service/** - Business logic
- **repository/** - Spring Data JPA interfaces
- **entity/** - JPA entities with `BaseEntity` providing common audit fields
- **dto/** - Request/Response objects organized by domain
- **security/** - JWT authentication (`JwtService`, `JwtAuthenticationFilter`)
- **exception/** - Global exception handling with `ApiException` and `GlobalExceptionHandler`

Database migrations: `src/main/resources/db/migration/V*.sql` (Flyway)

### Frontend
```
frontend/src/
├── api/              # Axios client with auto token refresh (client.ts)
├── context/          # React Contexts
│   ├── AuthContext.tsx    # Auth state, login/logout, token management
│   └── ThemeContext.tsx   # Dark mode (light/dark/system), localStorage persistence
├── components/
│   ├── ui/           # Reusable primitives (Button, Input, Card, Dialog, etc.)
│   ├── layout/       # MainLayout, Sidebar, AdminLayout
│   ├── LanguageSwitch.tsx
│   └── ThemeSwitch.tsx
├── pages/            # Route components with domain-specific FormModals
│   ├── auth/         # Login, Register, ForgotPassword, ResetPassword
│   ├── dashboard/
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   ├── recurring/
│   ├── debts/
│   ├── family/
│   ├── savings/
│   ├── settings/
│   ├── notifications/
│   └── admin/        # Admin-only pages (users, categories, token-usage)
├── i18n/locales/     # vi.json, en.json, ja.json
├── types/            # TypeScript interfaces matching backend DTOs
└── lib/utils.ts      # cn() helper for Tailwind class merging
```

Path alias: `@/` → `./src/`

### Styling System (Tailwind CSS v4)
CSS variables defined in `src/index.css` using `@theme` directive:

```css
@theme {
  /* Semantic colors */
  --color-background, --color-foreground
  --color-card, --color-card-foreground
  --color-primary, --color-primary-foreground
  --color-secondary, --color-muted, --color-accent
  --color-destructive, --color-border, --color-input, --color-ring

  /* Finance colors (same in light/dark) */
  --color-income: #22c55e;   /* Green */
  --color-expense: #ef4444;  /* Red */
  --color-transfer: #3b82f6; /* Blue */
  --color-warning: #f59e0b;  /* Amber */
}

.dark { /* Dark mode overrides */ }
```

FOUC prevention script in `index.html` sets theme class before React loads.

### Data Flow
1. Frontend uses TanStack Query for server state management
2. API calls go through `apiClient` with JWT in Authorization header
3. Backend validates JWT via `JwtAuthenticationFilter`
4. Services access data via repositories with user-scoped queries

## Key Patterns

- Backend uses Lombok (`@Data`, `@Builder`) and MapStruct for DTO mapping
- Frontend forms use React Hook Form + Zod for validation
- All protected routes wrapped in `MainLayout` which checks auth state
- Tokens stored in localStorage (`accessToken`, `refreshToken`)
- Theme preference stored in localStorage (`theme`)
- Backend entities are user-scoped (multi-tenant via user_id foreign keys)
- i18n: react-i18next với 3 locales (vi, en, ja)

## Key Files Reference

| Purpose | File |
|---------|------|
| API client config | `frontend/src/api/client.ts` |
| Auth context | `frontend/src/context/AuthContext.tsx` |
| Theme context | `frontend/src/context/ThemeContext.tsx` |
| CSS variables | `frontend/src/index.css` |
| Sidebar navigation | `frontend/src/components/layout/Sidebar.tsx` |
| i18n Vietnamese | `frontend/src/i18n/locales/vi.json` |
| Backend JWT | `backend/src/main/java/.../security/JwtService.java` |
| DB migrations | `backend/src/main/resources/db/migration/` |
