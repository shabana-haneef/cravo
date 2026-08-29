# Cravo - Multi-Vendor Hyper-Local E-Commerce Platform

Cravo is a full-stack, multi-tenant hyper-local e-commerce platform that seamlessly connects Customers, Sellers (Vendors/Shops), and Administrators. The system features real-time WebSocket notifications, automated background shipping and order maintenance workers, flexible payment processing, and a scalable containerized deployment architecture.

---

## 🏗️ High-Level System Architecture

```
                                 ┌────────────────────────┐
                                 │     Client Browser     │
                                 └───────────┬────────────┘
                                             │
                                   HTTP / REST / WebSockets
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │   Nginx Web Server   │
                                  │  (Frontend App Port) │
                                  └──────────┬───────────┘
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │   Node.js / Express  │
                                  │   Backend API (v1)   │
                                  └─┬───┬─────┬──────┬───┘
                                    │   │     │      │
           ┌────────────────────────┘   │     │      └────────────────────────┐
           ▼                            ▼     ▼                               ▼
  ┌─────────────────┐        ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ PostgreSQL (DB) │        │ Redis Store │  │ BullMQ Queue     │  │ Socket.io Engine │
  │ (Prisma ORM)    │        │ Rate-Limit /│  │ Workers (Jobs)   │  │ (Redis Adapter)  │
  └─────────────────┘        │ PubSub/Cache│  └──────────────────┘  └──────────────────┘
                             └─────────────┘
                                                      │
                                                      ▼
                                       ┌────────────────────────────┐
                                       │    External Services       │
                                       │ Delhivery | Razorpay       │
                                       │ Resend    | Cloudinary     │
                                       └────────────────────────────┘
```

---

## 🛠️ Technology Stack Breakdown

### 1. **Frontend (`/apps/frontend`)**
- **Core Framework & Build Tool**: React 19 bundled with Vite 8.
- **Routing**: React Router DOM (v7) supporting nested layouts.
- **State Management**:
  - **Client UI & Local State**: Zustand (`auth.store.js`, `cart.store.js`, `notification.store.js`).
  - **Server State & Caching**: TanStack React Query (v5) for data fetching, caching, automatic refetching, and optimistic updates.
- **Styling & UI**:
  - Tailwind CSS v4 + Lucide React icons.
  - Framer Motion for interactive UI animations.
  - Sonner for toast notifications.
- **Forms & Validation**: `react-hook-form` integrated with `zod` validation schemas via `@hookform/resolvers`.
- **Real-Time Engine**: `socket.io-client` for live status and notification feeds.
- **Authentication**: JWT authentication with HttpOnly cookies / Bearer tokens and Google OAuth SSO (`@react-oauth/google`).

---

### 2. **Backend (`/apps/backend`)**
- **Runtime Environment**: Node.js ES Modules (`"type": "module"`).
- **Core Web Framework**: Express 5 (`express@^5.2.1`).
- **Database & ORM**: PostgreSQL 15 accessed via Prisma ORM (`@prisma/client`).
- **Cache & In-Memory Store**: Redis (`redis@^6.0.0`) used for:
  - Distributed Rate Limiting (`express-rate-limit` + `rate-limit-redis`).
  - Token blacklisting and session management.
  - Socket.io Redis Adapter for multi-instance event scaling.
- **Background Tasks & Queue Management**: BullMQ powered by Redis for background processing:
  - **Delhivery Sync Worker**: Shipping status polling and synchronization.
  - **Order Maintenance Worker**: Auto-expiring unpaid orders.
  - **Campaign Expiry Worker**: Managing dynamic seller promotion windows.
  - **Sitemap Worker**: Generating SEO sitemaps asynchronously.
  - Built-in Queue Dashboard via `@bull-board/express` at `/api/admin/queues`.
- **Real-Time Communication**: Socket.io (`socket.io@^4.8.3`) with Redis Pub/Sub adapter.
- **Logging & Monitoring**: `pino` & `pino-pretty` structured logger with HTTP request middleware.
- **API Documentation**: Interactive Swagger UI at `/api-docs`.

---

### 3. **Integrations & Third-Party APIs**
- **Logistics & Shipping**: **Delhivery API** (Real-time shipping rates, waybill generation, pickup scheduling, tracking webhooks).
- **Payments**: **Razorpay** (Checkout sessions, webhook signature verification, refunds).
- **Cloud Storage**: **Cloudinary** (Product media, shop banners, seller verification document storage).
- **Email Delivery**: **Resend** (Transactional emails, verification codes, password reset links).

---

### 4. **Infrastructure & Deployment**
- **Docker Compose**: Orchestrates 4 isolated services (`cravo_frontend`, `cravo_backend`, `cravo_postgres`, `cravo_redis`).
- **Nginx Web Server**: Multi-stage production frontend Docker image serving static assets via Nginx on port 8080 (mapped to port 80).
- **Process Management**: PM2 zero-downtime deployment support (`process.send('ready')`).

---

## 📂 Repository Structure

```
cravo/
├── apps/
│   ├── backend/               # Express 5 REST API & WebSocket server
│   │   ├── prisma/            # Database schema & migrations
│   │   ├── src/
│   │   │   ├── config/        # Environment & service configurations
│   │   │   ├── lib/           # Socket & database connections
│   │   │   ├── modules/       # Domain modules (auth, orders, products, sellers...)
│   │   │   ├── routes/        # Router registrations
│   │   │   └── shared/        # Middlewares, utils, and queue managers
│   │   └── Dockerfile
│   └── frontend/              # React 19 + Vite SPA
│       ├── src/
│       │   ├── components/    # Common UI components
│       │   ├── features/      # Feature modules (admin, seller, cart, orders...)
│       │   ├── hooks/         # Custom React hooks
│       │   ├── lib/           # Axios & socket clients
│       │   └── store/         # Zustand global stores
│       ├── Dockerfile
│       └── nginx.conf
├── docker-compose.yml         # Full-stack multi-container Docker compose config
└── package.json               # Root scripts for monorepo development
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v20+) & npm
- Docker & Docker Compose (optional, for containerized execution)
- PostgreSQL 15+ & Redis 7+ (if running locally without Docker)

### Running with Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cravo
   ```

2. Setup environment variables:
   Copy `.env` variables into `apps/backend/.env` and `apps/frontend/.env`.

3. Launch all services:
   ```bash
   docker-compose up --build -d
   ```

4. Access the applications:
   - **Frontend App**: `http://localhost`
   - **Backend API**: `http://localhost:5000`
   - **Swagger API Docs**: `http://localhost:5000/api-docs`
   - **BullMQ Admin Dashboard**: `http://localhost:5000/api/admin/queues`

---

## 📜 License

ISC License.
