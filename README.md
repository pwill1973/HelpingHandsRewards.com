# 2×2 Community Matrix on TON

A production-ready decentralized community support system built on the TON blockchain, deployed on Cloudflare Pages with D1 database.

## 🌟 Project Overview

**Name**: 2×2 Community Matrix on TON  
**Description**: Decentralized multi-level community support system using a 2×2 matrix structure  
**Philosophy**: People helping people through transparent, on-chain community rewards

### Key Features

- ✅ **Email/Password Authentication** with JWT tokens
- ✅ **TON Wallet Integration** via TonConnect
- ✅ **2×2 Community Matrix Logic** with automatic placement and spillover
- ✅ **Referral System** with unique referral codes  
- ✅ **Community Rewards Tracking** (Referral, Matrix, Community)
- ✅ **Admin Dashboard** with comprehensive statistics
- ✅ **Real-time Matrix Visualization** with beautiful UI
- ✅ **Mobile-Responsive Design** with TailwindCSS

## 🚀 URLs

### Development
- **Local**: http://localhost:3000
- **Sandbox**: https://3000-inlwaau80q6uz5jkf2sig-8f57ffe2.sandbox.novita.ai

### Production (After Deployment)
- **Cloudflare Pages**: `https://ton-community-matrix.pages.dev`
- **API Health Check**: `/api/health`

## 📊 Current Status

### ✅ Completed Features
1. Full authentication system (register, login, JWT)
2. User profile management with sponsor tracking
3. 2×2 Community Matrix placement algorithm
4. Breadth-first spillover logic for full matrices
5. TON wallet connection and linking
6. Dashboard with personal stats and referral link
7. Matrix visualization page with hierarchical display
8. Admin panel with system-wide statistics
9. Contribution and reward tracking (database-ready)
10. TON Service abstraction layer (stubbed for future smart contract integration)

### 🔄 Features In Progress
- Smart contract integration (stubbed, ready for TON contract deployment)
- On-chain contribution verification
- Real reward distribution via blockchain

### 📋 Next Steps for Development
1. **Deploy TON Smart Contract**: Implement the actual 2×2 matrix smart contract on TON testnet
2. **Integrate TonService**: Replace stub methods with real TON blockchain calls
3. **Test Contributions**: Enable real TON contributions and verify on-chain
4. **Deploy to Production**: Deploy to Cloudflare Pages and connect production D1 database
5. **Add Testing**: Implement unit tests for matrix placement logic
6. **SEO Optimization**: Add meta tags and OpenGraph images

## 🏗️ Technology Stack

### Backend
- **Hono** - Lightweight, fast web framework for Cloudflare Workers
- **Cloudflare D1** - Globally distributed SQLite database
- **Drizzle ORM** - TypeScript ORM for D1
- **JWT (jose)** - Secure authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TonConnect UI React** - TON wallet integration

### Deployment
- **Cloudflare Pages** - Edge-first hosting
- **Wrangler** - Cloudflare CLI tool
- **Vite** - Fast build tool
- **PM2** - Process manager for local development

## 📦 Project Structure

```
webapp/
├── src/
│   ├── server/              # Hono backend
│   │   ├── db/             # Database schema and client
│   │   ├── services/       # Business logic services
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth middleware
│   │   └── index.tsx       # Server entry point
│   ├── client/              # React frontend
│   │   ├── pages/          # Route pages
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API client
│   │   └── main.tsx        # Client entry point
│   └── shared/              # Shared types and utilities
├── migrations/              # D1 database migrations
├── public/                  # Static assets
├── dist/                    # Build output
├── wrangler.jsonc          # Cloudflare configuration
├── package.json            # Dependencies
└── README.md               # This file
```

## 🔧 Data Architecture

### Database Tables (Cloudflare D1)

#### Users
- Stores user accounts, credentials, referral codes, TON wallets
- Tracks sponsor relationships via `referred_by_id`

#### Matrix Positions
- Represents the 2×2 matrix structure (6 positions per user)
- Levels: Level 1 (positions 1-2), Level 2 (positions 3-6)
- Tracks which user fills each position

#### Contributions
- Records community contributions (future on-chain transactions)
- Tracks status: pending, confirmed, failed
- Links to TON transaction hashes

#### Rewards
- Tracks community rewards distribution
- Types: REFERRAL, MATRIX, COMMUNITY
- Future: Will be distributed via smart contract

### Key Services

#### AuthService
- User registration with unique codes generation
- Secure password hashing
- JWT token management
- Profile retrieval with sponsor info

#### MatrixService
- 2×2 matrix initialization for new users
- Automatic member placement
- Breadth-first spillover when matrix is full
- Matrix visualization data generation

#### TonService (Stubbed)
- Wallet linking and validation
- Contribution intent creation (ready for smart contract)
- Transaction verification (ready for TON Center API)
- On-chain status queries (ready for contract integration)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Wrangler CLI (installed via npm)
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd webapp

# Install dependencies
npm install

# Copy environment variables
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your secrets
nano .dev.vars
```

### Local Development

```bash
# Build the project
npm run build

# Apply database migrations
npm run db:migrate:local

# Start development server
npm run dev:sandbox

# Or use PM2 for daemon mode
pm2 start ecosystem.config.cjs
pm2 logs ton-matrix --nostream
```

### Database Management

```bash
# Generate new migration
npm run db:generate

# Apply migrations locally
npm run db:migrate:local

# Apply migrations to production
npm run db:migrate:prod

# Reset local database
npm run db:reset

# Open Drizzle Studio
npm run db:studio
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Matrix
- `GET /api/matrix` - Get user's matrix view
- `GET /api/matrix/:userId` - Get specific user's matrix (admin only)

### TON Integration
- `POST /api/ton/link-wallet` - Link TON wallet to account
- `GET /api/ton/status` - Get TON wallet and on-chain status
- `GET /api/ton/contract-address` - Get smart contract address

### Statistics
- `GET /api/stats/dashboard` - Get user dashboard stats
- `GET /api/stats/contributions` - Get user's contribution history
- `GET /api/stats/rewards` - Get user's reward history
- `GET /api/stats/admin` - Get admin statistics (admin only)

## 📖 User Guide

### Joining the Community

1. **Get a Referral Link**: Ask an existing member for their referral link (format: `/join?ref=ABC12345`)
2. **Register**: Visit the referral link and fill in your details
3. **Automatic Placement**: System automatically places you in your sponsor's 2×2 matrix
4. **Get Your Link**: After registration, copy your referral link from the dashboard

### Understanding Your Matrix

Your 2×2 Community Matrix has **6 positions**:
- **Level 1**: 2 positions (left and right under you)
- **Level 2**: 4 positions (2 under each Level 1 position)

When you invite members, they are placed in available positions from left to right, top to bottom.

### Spillover System

When your matrix is full (all 6 positions filled), new referrals automatically "spill over" into the first available position in your downline's matrices. This creates a cooperative community support system.

### TON Wallet Connection

1. **Navigate to Dashboard**
2. **Click "Connect TON Wallet"**
3. **Choose your TON wallet** (Tonkeeper, MyTonWallet, etc.)
4. **Approve connection**
5. **Wallet automatically linked** to your account

### Making Contributions (Coming Soon)

Once smart contracts are deployed:
1. Connect your TON wallet
2. Click "Make Contribution"
3. Approve transaction in your wallet
4. Contribution is recorded on-chain

## 🔐 Security & Compliance

### Wording Policy

This project follows strict wording guidelines to ensure compliance:

**✅ Allowed Terms:**
- Contribution, Recurring Rewards, Referral Rewards
- Community Support, Community Matrix
- Decentralized Community, People Helping People

**❌ Prohibited Terms:**
- Income, Earnings, Profit, ROI
- Investment, Passive Income, Get Rich
- High-Yield, Interest, Financial Returns

### Security Features
- Bcrypt password hashing (10 salt rounds)
- JWT authentication with 7-day expiration
- SQL injection prevention via Drizzle ORM
- TON address validation before linking
- Admin-only endpoints protection

## 🚀 Deployment

### Cloudflare Pages Deployment

1. **Create D1 Database**:
```bash
npx wrangler d1 create ton-matrix-db
# Copy the database_id to wrangler.jsonc
```

2. **Apply Migrations to Production**:
```bash
npm run db:migrate:prod
```

3. **Set Environment Variables**:
```bash
npx wrangler pages secret put JWT_SECRET --project-name ton-community-matrix
npx wrangler pages secret put TON_NETWORK --project-name ton-community-matrix
```

4. **Deploy**:
```bash
npm run deploy:prod
```

### Production URLs
- Production: `https://ton-community-matrix.pages.dev`
- Branch: `https://main.ton-community-matrix.pages.dev`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Register new user without referral
- [ ] Register new user with referral code
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials fails
- [ ] View dashboard statistics
- [ ] Copy and share referral link
- [ ] Connect TON wallet
- [ ] View 2×2 matrix visualization
- [ ] Check matrix positions update after referral
- [ ] Admin dashboard shows correct stats

### Future: Automated Tests
```bash
npm test
```

## 🤝 Contributing

This is a production system. Before contributing:
1. Read the wording policy carefully
2. Test locally with PM2
3. Ensure migrations work correctly
4. Follow TypeScript best practices
5. Keep TON integration abstracted

## 📄 License

This project is private and proprietary.

## 🆘 Support & Contact

For technical questions or issues:
1. Check the logs: `pm2 logs ton-matrix --nostream`
2. Review Wrangler logs: `~/.config/.wrangler/logs/`
3. Test API health: `curl http://localhost:3000/api/health`

## 🎯 Roadmap

### Phase 1: Current (✅ Complete)
- Full authentication system
- 2×2 matrix logic and placement
- Frontend UI with matrix visualization
- TON wallet connection
- Database schema and migrations

### Phase 2: Smart Contract Integration (🔄 In Progress)
- Deploy TON smart contract
- Integrate real contribution flow
- On-chain reward distribution
- Transaction verification

### Phase 3: Production Launch
- Security audit
- Performance optimization
- User documentation
- Marketing materials

### Phase 4: Advanced Features
- Multi-matrix system
- Advanced analytics
- Mobile app
- Internationalization

---

**Built with ❤️ for the TON community**

*Last Updated: 2024-11-25*
