# HelpingHandsRewards2x2 Smart Contract

## Overview

This Tact smart contract implements a decentralized 2×2 Community Matrix system on TON with the following features:

- **10 Contribution Levels**: 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560 TON
- **Equal Distribution**: Strict 1→2→3→4→5→6 slot filling order
- **Auto-Upgrade**: Position 5 automatically upgrades to next level
- **Re-entry**: Position 6 triggers re-entry with new cycle
- **Native TON**: Currently uses native TON (ready for USDT-TON Jetton upgrade)

## Architecture

### Data Structures

**UserState**
- `inviter`: Address of user's sponsor
- `activeLevelsMask`: Bitmask tracking activated levels (bits 1-10)

**MatrixInstance**
- `owner`: Matrix owner address
- `level`: Contribution level (1-10)
- `cycle`: Cycle number (increments on re-entry)
- `inviter`: Owner's inviter for re-entry routing
- `nextSlot`: Next slot to fill (1-6, or 7 when full)

### Matrix Structure

```
         [YOU]
        /     \
    [1]       [2]      ← Level 1
   /  \       /  \
 [3]  [5]   [4]  [6]   ← Level 2
```

**Slot Order**: ALWAYS 1 → 2 → 3 → 4 → 5 → 6

### Reward Distribution

| Slot | Function | Recipient | Amount |
|------|----------|-----------|---------|
| 1, 2 | Upline Reward | Owner's Inviter | 100% |
| 3, 4 | **Direct Recurring Reward** | Matrix Owner | 100% |
| 5 | **Auto-Upgrade** | Next Level Activation or Owner | 100% |
| 6 | **Re-entry** | Triggers Re-entry Process | 100% |

## Messages

### ActivateLevel

Activate a contribution level and join matrix.

```typescript
message ActivateLevel {
    level: Int as uint8;      // 1-10
    inviter: Address;         // Sponsor address
}
```

**Usage:**
```typescript
send({
    to: contractAddress,
    value: LEVEL_AMOUNT,
    body: ActivateLevel{
        level: 1,
        inviter: sponsorAddress
    }.toCell()
})
```

### ManualUpgrade

Manually upgrade to a level without matrix placement.

```typescript
message ManualUpgrade {
    level: Int as uint8;      // 1-10
}
```

## Events

All events are emitted for off-chain tracking:

### UserRegistered
```typescript
message UserRegistered {
    user: Address;
    inviter: Address;
    timestamp: Int as uint32;
}
```

### LevelActivated
```typescript
message LevelActivated {
    user: Address;
    level: Int as uint8;
    cycle: Int as uint16;
    timestamp: Int as uint32;
}
```

### MatrixPositionFilled
```typescript
message MatrixPositionFilled {
    matrixOwner: Address;
    level: Int as uint8;
    cycle: Int as uint16;
    slotNumber: Int as uint8;
    filledBy: Address;
    timestamp: Int as uint32;
}
```

### RewardSent
```typescript
message RewardSent {
    recipient: Address;
    amount: Int as coins;
    rewardType: String;
    level: Int as uint8;
    timestamp: Int as uint32;
}
```

### AutoUpgradeTriggered
```typescript
message AutoUpgradeTriggered {
    user: Address;
    fromLevel: Int as uint8;
    toLevel: Int as uint8;
    timestamp: Int as uint32;
}
```

### ReentryTriggered
```typescript
message ReentryTriggered {
    user: Address;
    level: Int as uint8;
    newCycle: Int as uint16;
    timestamp: Int as uint32;
}
```

### MatrixCompleted
```typescript
message MatrixCompleted {
    owner: Address;
    level: Int as uint8;
    cycle: Int as uint16;
    timestamp: Int as uint32;
}
```

## Getter Functions

### getUserState
Get user's state including inviter and active levels.

```typescript
get fun getUserState(addr: Address): UserState?
```

### getUserCycleForLevel
Get user's current cycle for a specific level.

```typescript
get fun getUserCycleForLevel(addr: Address, level: Int): Int
```

### getMatrixData
Get matrix instance data.

```typescript
get fun getMatrixData(owner: Address, level: Int, cycle: Int): MatrixInstance?
```

### getMatrixSlots
Get all filled slots for a matrix.

```typescript
get fun getMatrixSlots(owner: Address, level: Int, cycle: Int): map<Int, Address>
```

### getLevelAmount
Get required contribution amount for a level.

```typescript
get fun getLevelAmount(level: Int): Int
```

### isUserLevelActive
Check if user has activated a specific level.

```typescript
get fun isUserLevelActive(addr: Address, level: Int): Bool
```

### getTotalUsers
Get total number of registered users.

```typescript
get fun getTotalUsers(): Int
```

### getTotalMatrices
Get total number of created matrices.

```typescript
get fun getTotalMatrices(): Int
```

## Business Logic Flow

### User Registration & Level Activation

1. User sends `ActivateLevel` message with required TON amount
2. Contract validates level and amount
3. User state is created/updated with inviter reference
4. Level is activated (bit set in activeLevelsMask)
5. Empty matrix created for user at cycle 1
6. User is placed in inviter's matrix

### Matrix Placement

1. Find inviter's current matrix for level
2. Fill next available slot (1-6 in order)
3. Route contribution based on slot number
4. Emit `MatrixPositionFilled` event
5. If slot 6 filled, mark matrix as complete

### Slot 5: Auto-Upgrade

When slot 5 is filled:
1. Check if owner has next level activated
2. If NO: Activate next level (create cycle 1 matrix)
3. If YES: Send amount as recurring reward
4. Emit `AutoUpgradeTriggered` or `RewardSent` event

### Slot 6: Re-entry

When slot 6 is filled:
1. Increment owner's cycle for current level
2. Create new empty matrix for new cycle
3. Place owner in inviter's matrix as new member
4. Emit `ReentryTriggered` event
5. Process placement rewards for inviter's matrix

## Deployment

### Prerequisites

```bash
npm install -g @tact-lang/compiler
npm install -g @ton/blueprint
```

### Compile Contract

```bash
tact compile contracts/HelpingHandsRewards2x2.tact
```

### Deploy to Testnet

```bash
# Using Blueprint
npx blueprint create HelpingHandsRewards2x2 --type tact
npx blueprint run deployContract --testnet
```

### Deploy Script Example

```typescript
import { toNano } from '@ton/core';
import { HelpingHandsRewards2x2 } from '../build/HelpingHandsRewards2x2';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const adminAddress = provider.sender().address!;
    
    const contract = provider.open(
        await HelpingHandsRewards2x2.fromInit(adminAddress)
    );

    await contract.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(contract.address);
    
    console.log('Contract deployed at:', contract.address);
}
```

## Integration with Off-Chain Backend

### Event Listening

Use TON API to listen for emitted events:

```typescript
import { TonClient } from '@ton/ton';

const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
});

// Listen for transactions
const transactions = await client.getTransactions(contractAddress, {
    limit: 100
});

// Parse events from transaction data
for (const tx of transactions) {
    // Decode event messages from tx.description
    const events = parseEvents(tx);
    
    for (const event of events) {
        if (event.type === 'MatrixPositionFilled') {
            // Update off-chain database
            await db.updateMatrixPosition({
                owner: event.matrixOwner,
                level: event.level,
                cycle: event.cycle,
                slotNumber: event.slotNumber,
                filledBy: event.filledBy
            });
        }
    }
}
```

### Query Contract State

```typescript
// Get user state
const userState = await contract.getUserState(userAddress);

// Get matrix data
const matrixData = await contract.getMatrixData(
    userAddress,
    1, // level
    1  // cycle
);

// Get matrix slots
const slots = await contract.getMatrixSlots(userAddress, 1, 1);
```

### Send Activation Transaction

```typescript
import { toNano } from '@ton/core';

// Activate level 1 (5 TON)
await contract.send(
    provider.sender(),
    {
        value: toNano('5'),
    },
    {
        $$type: 'ActivateLevel',
        level: 1n,
        inviter: inviterAddress
    }
);
```

## Security Considerations

1. **Amount Validation**: Contract validates exact contribution amounts
2. **Gas Management**: MIN_GAS_AMOUNT reserved for operations
3. **Access Control**: Only owner can withdraw contract balance
4. **Inviter Validation**: Checks inviter is registered and level-active
5. **Cycle Tracking**: Prevents double-spending via cycle increments

## Future Enhancements

### USDT-TON Jetton Integration

To integrate USDT-TON Jettons:

1. Add Jetton wallet references
2. Replace `send()` calls with Jetton transfers
3. Handle `transfer_notification` messages
4. Update amount validation for Jetton decimals

```typescript
// Example Jetton transfer (future)
send(SendParameters{
    to: jettonWalletAddress,
    value: toNano('0.05'),
    body: beginCell()
        .storeUint(0xf8a7ea5, 32) // transfer op
        .storeUint(0, 64)
        .storeCoins(amount)
        .storeAddress(recipient)
        .storeAddress(responseAddress)
        .storeBit(false)
        .storeCoins(toNano('0.01'))
        .storeBit(false)
        .endCell()
});
```

### Spillover Algorithm

Current implementation fills inviter's matrix directly. Future versions can implement BFS spillover:

```typescript
fun findAvailableMatrix(startAddr: Address, level: Int): Address {
    // Breadth-first search through downline
    // Find next matrix with available slots
    // Return owner address
}
```

## Testing

### Unit Tests

```bash
# Using Blueprint
npx blueprint test
```

### Test Scenarios

1. ✅ User registration with inviter
2. ✅ Level activation and matrix creation
3. ✅ Matrix slot filling in order (1-6)
4. ✅ Slot 3&4: Direct rewards to owner
5. ✅ Slot 5: Auto-upgrade logic
6. ✅ Slot 6: Re-entry with cycle increment
7. ✅ Matrix completion handling
8. ✅ Multiple levels per user
9. ✅ Getter functions return correct data
10. ✅ Event emissions

## Support & Documentation

- **TON Docs**: https://docs.ton.org/develop/smart-contracts/
- **Tact Docs**: https://docs.tact-lang.org/
- **TON API**: https://toncenter.com/api/v2/
- **Blueprint**: https://github.com/ton-org/blueprint

## License

[Specify your license]

---

**Version**: 1.0.0  
**Network**: TON Testnet  
**Language**: Tact  
**Status**: Ready for Testing
