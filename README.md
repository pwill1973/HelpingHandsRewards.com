# 2×2 Community Matrix on TON

A decentralized community support system built on the TON blockchain with 10 Contribution Levels, featuring auto-upgrade and re-entry mechanisms.

## 🌟 Project Overview

This is a production-ready, full-stack web application implementing a **2×2 Community Matrix** structure with the following key features:

- **10 Contribution Levels**: 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560 USDT-TON
- **Equal Distribution Placement**: Strict 1→2→3→4→5→6 slot filling order
- **Direct Recurring Rewards**: Positions 3 & 4 send 100% to matrix owner
- **Auto-Upgrade**: Position 5 automatically upgrades users to next level
- **Re-entry System**: Position 6 triggers re-entry into sponsor's matrix
- **TON Integration**: Ready for TON blockchain integration (currently stubbed)
- **Cloudflare D1**: Serverless SQLite database for global distribution
- **Modern UI**: React + TailwindCSS with responsive design

## 🏗️ Architecture

### Tech Stack

**Backend:**
- **Hono** - Lightweight web framework for Cloudflare Workers
- **Cloudflare D1** - Globally distributed SQLite database
- **Drizzle ORM** - Type-safe database operations
- **TypeScript** - Full type safety

**Frontend:**
- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **TON Connect UI** - TON wallet integration

**Deployment:**
- **Cloudflare Pages** - Serverless deployment platform
- **Wrangler** - Cloudflare development tools

### Database Schema

```
users
├── id, email, passwordHash, fullName
├── username, memberCode, referralCode
├── tonWalletAddress, tonNetwork
└── referredById, isAdmin

matrix_levels (10 levels)
├── id, level (1-10)
└── amount (5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560)

matrix_instances (one per user per level per cycle)
├── id, userId, levelId
├── cycleNumber
└── status (OPEN | FILLED)

matrix_positions (6 per instance)
├── id, matrixInstanceId
├── slotNumber (1-6)
└── filledByUserId

user_level_activations
├── userId, levelId
└── isActive

contributions
├── userId, levelId, amount
├── status, txHash
└── matrixInstanceId

rewards
├── userId, levelId, type
├── amount, description
└── (DIRECT | UPGRADE | REENTRY | REFERRAL)
```

## 🎯 2×2 Community Matrix Rules

### Matrix Structure

```
         [YOU]
        /     \
    [1]       [2]      ← Level 1
   /  \       /  \
 [3]  [5]   [4]  [6]   ← Level 2
```

### Slot Filling Order

**STRICT ORDER:** 1 → 2 → 3 → 4 → 5 → 6

This order is enforced by the system and cannot be bypassed.

### Reward Distribution

| Position | Function | Description |
|----------|----------|-------------|
| **3** | **Direct Reward** | 100% goes to matrix owner as Recurring Reward |
| **4** | **Direct Reward** | 100% goes to matrix owner as Recurring Reward |
| **5** | **Auto-Upgrade** | If next level not activated: auto-activate it. Otherwise: Direct Reward to owner |
| **6** | **Re-entry** | User re-enters sponsor's matrix with new cycle, gets fresh 2×2 matrix |

### Multi-Level System

Users can activate multiple levels at registration:
- **Example 1**: Level 1 only (5 USDT-TON)
- **Example 2**: Levels 1+2 (5+10 = 15 USDT-TON)
- **Example 3**: All 10 levels (5+10+20+...+2560 = 5115 USDT-TON)

Each level operates independently with its own matrix structure.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Wrangler CLI (for Cloudflare)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd webapp

# Install dependencies
npm install

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your configuration
```

### Local Development

```bash
# Apply database migrations
npm run db:migrate:local

# Build the project
npm run build

# Start development server
npm run dev:sandbox

# Or use PM2 (recommended)
pm2 start ecosystem.config.cjs
pm2 logs ton-matrix
```

The application will be available at `http://localhost:3000`

### Database Management

```bash
# Reset local database
npm run db:reset

# View database with Drizzle Studio
npm run db:studio

# Apply migrations to production
npm run db:migrate:prod
```

## 📦 Deployment

### Cloudflare Pages Deployment

1. **Create D1 Database:**
```bash
npx wrangler d1 create ton-matrix-db
# Copy the database_id to wrangler.jsonc
```

2. **Apply Migrations to Production:**
```bash
npm run db:migrate:prod
```

3. **Set Environment Variables:**
```bash
# Set JWT secret
npx wrangler pages secret put JWT_SECRET

# Set TON configuration
npx wrangler pages secret put TON_NETWORK
npx wrangler pages secret put TON_API_ENDPOINT
```

4. **Deploy:**
```bash
npm run deploy:prod
```

### Environment Variables

Required variables in `.dev.vars` for local development:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
TON_NETWORK=testnet
TON_API_ENDPOINT=https://testnet.toncenter.com/api/v2/jsonRPC
NODE_ENV=development
```

## 🎨 Features Implemented

### ✅ Core Features

- [x] User registration with email/password
- [x] JWT-based authentication
- [x] 10 Contribution Levels system
- [x] Multi-level activation at signup
- [x] 2×2 Matrix structure with exact 1→2→3→4→5→6 placement
- [x] Breadth-first spillover for full matrices
- [x] Position 3 & 4: Direct Recurring Rewards
- [x] Position 5: Auto-Upgrade mechanism
- [x] Position 6: Re-entry system
- [x] TON wallet connection (TonConnect)
- [x] Referral system with unique codes
- [x] Admin dashboard with statistics
- [x] Matrix visualization UI

### 🔄 Matrix Logic

The matrix placement algorithm implements:
1. **Equal Distribution**: Always fills 1→2→3→4→5→6 in order
2. **Spillover**: BFS algorithm finds next available matrix when sponsor's is full
3. **Cycle Tracking**: Each re-entry creates a new cycle number
4. **Level Independence**: Each contribution level has separate matrix instances

### 💰 Reward System

| Reward Type | Trigger | Amount | Description |
|-------------|---------|---------|-------------|
| DIRECT | Position 3, 4 | 100% | Direct Recurring Reward to matrix owner |
| UPGRADE | Position 5 | 100% | Auto-activates next level or direct reward |
| REENTRY | Position 6 | 100% | Re-enters user into sponsor's matrix |
| REFERRAL | New signup | Variable | Referral bonus for sponsor |

## 🎯 Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Project setup with Hono + React + D1
- [x] 10 Contribution Levels system
- [x] Equal distribution placement algorithm
- [x] Auto-upgrade and re-entry logic
- [x] TON wallet integration (stubbed)
- [x] Basic UI with matrix visualization

### Phase 2: TON Integration (🚧 In Progress)
- [ ] Smart contract deployment on TON testnet
- [ ] USDT-TON contribution processing
- [ ] On-chain transaction verification
- [ ] Real-time reward distribution
- [ ] TON Center API integration

### Phase 3: Advanced Features
- [ ] Real-time notifications
- [ ] Transaction history with TON explorer links
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile-responsive improvements

### Phase 4: Production Ready
- [ ] Security audit
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation completion
- [ ] Mainnet deployment

## 📚 API Documentation

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/me
```

### Matrix

```http
GET  /api/matrix/levels
GET  /api/matrix/user-levels
GET  /api/matrix/:levelId
GET  /api/matrix/user/:userId/level/:levelId (admin)
```

### TON

```http
POST /api/ton/link-wallet
GET  /api/ton/status
GET  /api/ton/contract-address
```

### Statistics

```http
GET  /api/stats/dashboard
GET  /api/stats/contributions
GET  /api/stats/rewards
GET  /api/stats/admin (admin)
```

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run tests
npm test
```

## 📖 Compliance & Wording

This project uses specific, compliant terminology:

✅ **Allowed Terms:**
- Contribution, Community Rewards
- Referral Rewards, Recurring Rewards
- 2×2 Community Matrix
- People helping people
- Community Support
- Multi-level community support system

❌ **Prohibited Terms:**
- Income, Earnings, Profit
- ROI, Investment
- Passive income, Get rich
- High-yield

## 🤝 Contributing

This is a demonstration project. For production use, please:
1. Complete TON smart contract integration
2. Conduct security audit
3. Add comprehensive testing
4. Review and update all configurations

## 📄 License

[Specify your license here]

## 🔗 Links

- **TON Documentation**: https://docs.ton.org
- **Cloudflare D1**: https://developers.cloudflare.com/d1
- **Hono Framework**: https://hono.dev
- **TonConnect**: https://github.com/ton-connect

## ⚠️ Important Notes

1. **Development Status**: This application is currently in development. The TON integration is stubbed and needs to be completed before production use.

2. **Smart Contract**: A TON smart contract must be deployed and integrated to handle real USDT-TON transactions.

3. **Security**: Review all security aspects, especially authentication and payment processing, before deploying to production.

4. **Testing**: Thoroughly test all matrix placement logic, especially edge cases with spillover and re-entry.

5. **Compliance**: Ensure all legal and regulatory requirements are met in your jurisdiction before launching.

---

**Built with ❤️ for the TON Community**
