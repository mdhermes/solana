# RevShare Agent

Autonomous AI agent for Indian SaaS founders that monitors Dodo Payments webhooks, makes autonomous billing decisions, and pays affiliates in USDC on Solana devnet.

## Features

- **Autonomous Payout System**: Automatically pays affiliates in USDC when they hit payout thresholds
- **Policy Management**: Founder-controlled rules for payouts, monthly caps, and upgrades
- **Webhook Integration**: Listen to Dodo Payments events in real-time
- **LangChain Agent**: GPT-4-powered decision making with guardrails
- **Dashboard**: Real-time view of affiliates, payouts, and agent activity
- **Solana Integration**: Direct on-chain USDC transfers using Solana devnet

## Project Structure

```
revshare-agent/
├── backend/                 # Fastify + TypeScript backend
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── dodo/           # Dodo API integration
│   │   ├── solana/         # Solana wallet & transfers
│   │   ├── agent/          # LangChain agent & tools
│   │   ├── db/             # Prisma client
│   │   └── routes/         # API routes
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/                # React + Tailwind UI
│   ├── src/
│   │   ├── App.tsx         # Main component
│   │   ├── components/     # React components
│   │   └── api/            # API client
│   └── package.json
├── railway.toml            # Deployment config
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key
- Dodo Payments API credentials
- Solana devnet wallet with USDC

### Installation

1. **Clone and install dependencies:**

```bash
cd revshare-agent/backend
npm install

cd ../frontend
npm install
```

2. **Configure environment variables:**

Create `.env` in the backend directory:

```
DODO_API_KEY=your_api_key
DODO_WEBHOOK_SECRET=your_secret
OPENAI_API_KEY=your_openai_key
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=3000
DATABASE_URL=file:./dev.db
```

3. **Setup database:**

```bash
cd backend
npx prisma migrate dev --name init
```

4. **Fund your Solana wallet:**

The agent will create a wallet on first run. Fund it with USDC devnet:
https://spl-token-faucet.com/?token-name=USDC-Dev

### Running Locally

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` (Vite default)

## API Endpoints

### Dashboard

- `GET /api/dashboard` - Get wallet, affiliates, payouts, and activity
- `GET /api/policy` - Get current policy settings
- `PUT /api/policy` - Update policy settings
- `POST /api/seed` - Seed demo affiliates
- `POST /api/agent/run` - Manually trigger agent

### Webhooks

- `POST /webhooks/dodo` - Receive Dodo payment events

## Database Schema

### Affiliate
- `id` (UUID)
- `name` (String)
- `email` (String, unique)
- `solanaWallet` (String)
- `totalEarned` (Float)
- `totalPaid` (Float)
- `pendingAmount` (Float)

### Payout
- `id` (UUID)
- `affiliateId` (FK to Affiliate)
- `amountUsdc` (Float)
- `solanaTxHash` (String)
- `dodoEventId` (String)
- `status` (String)

### AgentAction
- `id` (UUID)
- `type` (String: "payout" | "plan_upgrade" | "credit_issued")
- `description` (String)
- `metadata` (JSON)

### Policy
- `id` (String: "singleton")
- `payoutThresholdUsd` (Float, default: 50)
- `maxMonthlyPayoutUsd` (Float, default: 500)
- `autoUpgradeOnOverage` (Boolean)
- `autoCancelInactiveDays` (Int)

## Critical TODOs

- [ ] Verify Dodo webhook signature verification
- [ ] Confirm PUT `/subscriptions/{id}` payload structure
- [ ] Verify credit entitlement ledger endpoint
- [ ] Map affiliates to Dodo customer IDs
- [ ] Confirm USDC devnet mint address: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

## Deployment on Railway

1. Push to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Add environment variables
4. Set `VITE_API_URL` to backend Railway URL for frontend
5. Deploy!

## Demo Sequence

After deployment:

1. `POST /api/seed` - Create mock affiliates
2. `GET /api/dashboard` - Check wallet address
3. Fund wallet with devnet USDC
4. `POST /api/agent/run` - Trigger agent payout
5. Watch dashboard update in real-time

## Tech Stack

- **Backend**: Fastify, TypeScript, Prisma, SQLite
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **AI**: LangChain, OpenAI GPT-4o-mini
- **Blockchain**: Solana Web3.js, SPL Token
- **Payments**: Dodo Payments API

## License

MIT
