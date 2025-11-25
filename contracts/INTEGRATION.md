# Smart Contract Integration Guide

## Overview

This guide explains how to integrate the `HelpingHandsRewards2x2` smart contract with the existing Hono + Cloudflare D1 backend.

## Architecture

```
┌─────────────────┐
│   React App     │ ← User Interface
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐  ┌────▼──────────┐
│  TON Wallet     │  │  Hono API     │
│  (TonConnect)   │  │  Backend      │
└────────┬────────┘  └────┬──────────┘
         │                 │
         │           ┌─────▼─────────┐
         │           │ Cloudflare D1 │
         │           │   Database    │
         │           └───────────────┘
         │
┌────────▼─────────────────────────┐
│  HelpingHandsRewards2x2.tact     │
│  Smart Contract (TON Testnet)    │
└──────────────────────────────────┘
```

## Integration Steps

### 1. Update TonService

Replace the stubbed `TonService` with real TON API calls.

**File**: `src/server/services/ton.service.ts`

```typescript
import { Address, beginCell, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

export class TonService {
  private client: TonClient;
  private contractAddress: Address;

  constructor(
    private db: DbClient,
    private tonNetwork: 'testnet' | 'mainnet',
    private tonApiEndpoint: string,
    contractAddr: string
  ) {
    this.client = new TonClient({
      endpoint: tonApiEndpoint
    });
    this.contractAddress = Address.parse(contractAddr);
  }

  /**
   * Create contribution intent with smart contract call data
   */
  async createContributionIntent(
    userId: number,
    levelId: number
  ): Promise<ContributionIntent> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.tonWalletAddress) {
      throw new Error('User wallet not connected');
    }

    // Get level amount
    const level = await this.db.query.matrixLevels.findFirst({
      where: eq(matrixLevels.id, levelId)
    });

    if (!level) {
      throw new Error('Invalid level');
    }

    // Get sponsor address
    let sponsorAddress = Address.parse('0:0000000000000000000000000000000000000000000000000000000000000000');
    if (user.referredById) {
      const sponsor = await this.db.query.users.findFirst({
        where: eq(users.id, user.referredById)
      });
      if (sponsor?.tonWalletAddress) {
        sponsorAddress = Address.parse(sponsor.tonWalletAddress);
      }
    }

    // Build ActivateLevel message
    const body = beginCell()
      .storeUint(0x12345678, 32) // ActivateLevel op code (use actual from compiled contract)
      .storeUint(0, 64) // query_id
      .storeUint(level.level, 8) // level number
      .storeAddress(sponsorAddress) // inviter address
      .endCell();

    return {
      intentId: `intent_${Date.now()}_${userId}_${levelId}`,
      amount: level.amount,
      currency: 'TON',
      destinationAddress: this.contractAddress.toString(),
      payload: body.toBoc().toString('base64'),
      memo: `Activate Level ${level.level}`
    };
  }

  /**
   * Verify transaction on blockchain
   */
  async verifyContribution(txHash: string): Promise<VerificationResult> {
    try {
      const tx = await this.client.getTransaction(
        this.contractAddress,
        BigInt(txHash)
      );

      if (!tx) {
        return {
          isValid: false,
          error: 'Transaction not found'
        };
      }

      // Parse transaction details
      const inMsg = tx.inMessage;
      if (!inMsg) {
        return {
          isValid: false,
          error: 'No incoming message'
        };
      }

      return {
        isValid: true,
        txHash: txHash,
        amount: Number(inMsg.value.coins) / 1e9,
        from: inMsg.info.src?.toString(),
        to: this.contractAddress.toString(),
        timestamp: new Date(tx.now * 1000).toISOString()
      };
    } catch (error) {
      console.error('Verify contribution error:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Get on-chain status from smart contract
   */
  async getOnChainStatus(userId: number): Promise<OnChainStatus> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.tonWalletAddress) {
      return {
        isActive: false,
        totalContributions: 0
      };
    }

    try {
      const userAddress = Address.parse(user.tonWalletAddress);

      // Call getUserState getter
      const result = await this.client.runMethod(
        this.contractAddress,
        'getUserState',
        [
          { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() }
        ]
      );

      // Parse result (adjust based on actual contract return type)
      const stack = result.stack;
      const activeLevelsMask = stack.readNumber();

      return {
        isActive: activeLevelsMask > 0,
        totalContributions: this.countActiveBits(activeLevelsMask),
        lastActivityTimestamp: new Date().toISOString(),
        matrixLevel: 1,
        rewardsEarned: 0
      };
    } catch (error) {
      console.error('Get on-chain status error:', error);
      return {
        isActive: false,
        totalContributions: 0
      };
    }
  }

  private countActiveBits(mask: number): number {
    let count = 0;
    for (let i = 0; i < 10; i++) {
      if ((mask & (1 << i)) !== 0) count++;
    }
    return count;
  }
}
```

### 2. Event Listener Service

Create a service to listen to smart contract events and sync with D1.

**File**: `src/server/services/event-listener.service.ts`

```typescript
import { TonClient, Address } from '@ton/ton';
import { eq } from 'drizzle-orm';
import type { DbClient } from '../db/client';
import { matrixPositions, rewards, contributions } from '../db/schema';

export class EventListenerService {
  private client: TonClient;
  private contractAddress: Address;
  private lastSeqno: number = 0;

  constructor(
    private db: DbClient,
    contractAddr: string,
    endpoint: string
  ) {
    this.client = new TonClient({ endpoint });
    this.contractAddress = Address.parse(contractAddr);
  }

  /**
   * Start listening to contract events
   */
  async start() {
    setInterval(() => this.pollTransactions(), 10000); // Poll every 10 seconds
  }

  private async pollTransactions() {
    try {
      const transactions = await this.client.getTransactions(
        this.contractAddress,
        { limit: 100 }
      );

      for (const tx of transactions) {
        if (tx.lt <= this.lastSeqno) continue;
        
        await this.processTransaction(tx);
        this.lastSeqno = Math.max(this.lastSeqno, Number(tx.lt));
      }
    } catch (error) {
      console.error('Poll transactions error:', error);
    }
  }

  private async processTransaction(tx: any) {
    // Parse out messages (events) from transaction
    const outMessages = tx.outMessages || [];

    for (const msg of outMessages) {
      const body = msg.body;
      if (!body) continue;

      try {
        // Parse event type (first 32 bits)
        const slice = body.beginParse();
        const opCode = slice.loadUint(32);

        switch (opCode) {
          case 0x11111111: // MatrixPositionFilled (use actual op code)
            await this.handleMatrixPositionFilled(slice);
            break;
          case 0x22222222: // RewardSent
            await this.handleRewardSent(slice);
            break;
          case 0x33333333: // AutoUpgradeTriggered
            await this.handleAutoUpgrade(slice);
            break;
          case 0x44444444: // ReentryTriggered
            await this.handleReentry(slice);
            break;
        }
      } catch (error) {
        console.error('Process message error:', error);
      }
    }
  }

  private async handleMatrixPositionFilled(slice: any) {
    // Parse event data
    const matrixOwner = slice.loadAddress().toString();
    const level = slice.loadUint(8);
    const cycle = slice.loadUint(16);
    const slotNumber = slice.loadUint(8);
    const filledBy = slice.loadAddress().toString();

    // Update D1 database
    const ownerUser = await this.db.query.users.findFirst({
      where: eq(users.tonWalletAddress, matrixOwner)
    });

    if (!ownerUser) return;

    // Find matrix instance
    const instance = await this.db.query.matrixInstances.findFirst({
      where: and(
        eq(matrixInstances.userId, ownerUser.id),
        eq(matrixInstances.levelId, level),
        eq(matrixInstances.cycleNumber, cycle)
      )
    });

    if (!instance) return;

    // Update matrix position
    await this.db.update(matrixPositions)
      .set({
        filledByUserId: filledByUser?.id,
        filledAt: sql`CURRENT_TIMESTAMP`
      })
      .where(and(
        eq(matrixPositions.matrixInstanceId, instance.id),
        eq(matrixPositions.slotNumber, slotNumber)
      ));
  }

  private async handleRewardSent(slice: any) {
    // Parse and record reward in database
    // Similar pattern to handleMatrixPositionFilled
  }

  private async handleAutoUpgrade(slice: any) {
    // Parse and record auto-upgrade event
  }

  private async handleReentry(slice: any) {
    // Parse and record re-entry event
  }
}
```

### 3. Frontend Integration

Update the frontend to send transactions via TonConnect.

**File**: `src/client/pages/DashboardPage.tsx`

```typescript
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Address, toNano, beginCell } from '@ton/core';

export default function DashboardPage() {
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();

  const handleActivateLevel = async (levelId: number) => {
    if (!tonAddress) {
      alert('Please connect your TON wallet first');
      return;
    }

    try {
      // Get contribution intent from backend
      const response = await api.createContributionIntent(levelId);
      const intent = response.data;

      // Send transaction via TonConnect
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: intent.destinationAddress,
            amount: toNano(intent.amount).toString(),
            payload: intent.payload // base64 encoded cell
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Store transaction hash
      console.log('Transaction sent:', result.boc);
      
      // Wait for confirmation (poll backend)
      await pollTransactionConfirmation(result.boc);
      
      alert('Level activated successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Activation error:', error);
      alert('Failed to activate level');
    }
  };

  return (
    // ... UI with activation buttons
  );
}
```

### 4. Environment Variables

Update `.dev.vars` and Cloudflare secrets:

```env
# Smart Contract
TON_CONTRACT_ADDRESS=EQBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TON_NETWORK=testnet
TON_API_ENDPOINT=https://testnet.toncenter.com/api/v2/jsonRPC
TON_API_KEY=your-toncenter-api-key

# JWT
JWT_SECRET=your-secret-key
```

### 5. Deploy Smart Contract

```bash
# Navigate to contracts folder
cd contracts

# Install dependencies
npm install

# Compile contract
npm run compile

# Deploy to testnet
npm run deploy:testnet

# Note the contract address and update environment variables
```

### 6. Start Event Listener

Add event listener to server startup:

**File**: `src/server/index.tsx`

```typescript
import { EventListenerService } from './services/event-listener.service';

// After app initialization
if (process.env.NODE_ENV === 'production') {
  const eventListener = new EventListenerService(
    db,
    process.env.TON_CONTRACT_ADDRESS!,
    process.env.TON_API_ENDPOINT!
  );
  
  eventListener.start();
  console.log('Event listener started');
}
```

## Testing Integration

### 1. Local Testing

```bash
# Terminal 1: Start local dev server
npm run dev:sandbox

# Terminal 2: Monitor D1 database
npx wrangler d1 execute ton-matrix-db --local --command="SELECT * FROM contributions"

# Terminal 3: Test API
curl http://localhost:3000/api/ton/contract-address
```

### 2. Testnet Testing

1. Deploy contract to TON testnet
2. Get testnet TON from faucet
3. Connect testnet wallet in frontend
4. Test level activation
5. Monitor events in D1
6. Verify matrix positions update

### 3. Event Verification

```bash
# Check if events are being captured
npx wrangler d1 execute ton-matrix-db --local --command="
  SELECT * FROM rewards 
  WHERE created_at > datetime('now', '-1 hour')
  ORDER BY created_at DESC 
  LIMIT 10
"
```

## Troubleshooting

### Contract Address Not Found
- Verify contract is deployed
- Check TON_CONTRACT_ADDRESS in environment
- Ensure network matches (testnet vs mainnet)

### Transaction Fails
- Check wallet has sufficient balance
- Verify level amount is correct
- Check contract is not paused

### Events Not Syncing
- Verify event listener is running
- Check TON API endpoint is accessible
- Review event parsing logic matches contract

### D1 Updates Not Reflecting
- Check database connection
- Verify user TON address matches
- Review D1 query logs

## Security Checklist

- [ ] Smart contract audited
- [ ] Private keys never in code
- [ ] Environment variables secured
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all user data
- [ ] TON address validation
- [ ] Transaction amount validation
- [ ] Event signature verification
- [ ] D1 parameterized queries
- [ ] Error messages don't leak data

## Next Steps

1. Complete smart contract testing
2. Deploy to TON testnet
3. Integrate TonService with real API
4. Implement event listener
5. Test end-to-end flow
6. Security audit
7. Deploy to mainnet

---

**Status**: Integration Guide  
**Version**: 1.0.0  
**Last Updated**: 2024
