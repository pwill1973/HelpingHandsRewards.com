// HelpingHandsRewards2x2.tact
//
// Tact contract for a 2×2 Community Matrix on TON
// with 10 Contribution Levels, Equal Distribution, auto-upgrade,
// and re-entry into inviter's matrix.
//
// CURRENT: Uses native TON for Contributions
// FUTURE: Can be extended to use USDT-TON Jetton transfers

import "@stdlib/deploy";

// Constants
const MAX_LEVEL: Int = 10;

// Level amounts in nanoTON (placeholder for USDT-TON)
const LEVEL_1: Int = 5000000000;      // 5 TON
const LEVEL_2: Int = 10000000000;     // 10 TON
const LEVEL_3: Int = 20000000000;     // 20 TON
const LEVEL_4: Int = 40000000000;     // 40 TON
const LEVEL_5: Int = 80000000000;     // 80 TON
const LEVEL_6: Int = 160000000000;    // 160 TON
const LEVEL_7: Int = 320000000000;    // 320 TON
const LEVEL_8: Int = 640000000000;    // 640 TON
const LEVEL_9: Int = 1280000000000;   // 1280 TON
const LEVEL_10: Int = 2560000000000;  // 2560 TON

// Minimum gas for operations
const MIN_GAS_AMOUNT: Int = ton("0.05");

// ========================================
// Messages
// ========================================

message ActivateLevel {
    level: Int as uint8;
    inviter: Address;
}

message ManualUpgrade {
    level: Int as uint8;
}

// ========================================
// Events (for off-chain logging)
// ========================================

message UserRegistered {
    user: Address;
    inviter: Address;
    timestamp: Int as uint32;
}

message LevelActivated {
    user: Address;
    level: Int as uint8;
    cycle: Int as uint16;
    timestamp: Int as uint32;
}

message MatrixPositionFilled {
    matrixOwner: Address;
    level: Int as uint8;
    cycle: Int as uint16;
    slotNumber: Int as uint8;
    filledBy: Address;
    timestamp: Int as uint32;
}

message RewardSent {
    recipient: Address;
    amount: Int as coins;
    rewardType: String;
    level: Int as uint8;
    timestamp: Int as uint32;
}

message AutoUpgradeTriggered {
    user: Address;
    fromLevel: Int as uint8;
    toLevel: Int as uint8;
    timestamp: Int as uint32;
}

message ReentryTriggered {
    user: Address;
    level: Int as uint8;
    newCycle: Int as uint16;
    timestamp: Int as uint32;
}

message MatrixCompleted {
    owner: Address;
    level: Int as uint8;
    cycle: Int as uint16;
    timestamp: Int as uint32;
}

// ========================================
// Data Structures
// ========================================

struct UserState {
    inviter: Address;
    activeLevelsMask: Int as uint16;  // Bitmask for 10 levels
    // Cycles per level stored in contract maps
}

struct MatrixSlot {
    slotNumber: Int as uint8;
    filledBy: Address;
    filledAt: Int as uint32;
}

struct MatrixInstance {
    owner: Address;
    level: Int as uint8;
    cycle: Int as uint16;
    inviter: Address;
    nextSlot: Int as uint8;  // 1-6, or 7 when full
    // Slots stored in contract maps
}

// ========================================
// Main Contract
// ========================================

contract HelpingHandsRewards2x2 with Deployable {
    
    owner: Address;
    
    // User data
    users: map<Address, UserState>;
    userCycles: map<Address, map<Int, Int>>;  // user -> level -> cycle
    
    // Matrix data
    matrices: map<Int, MatrixInstance>;  // hash -> MatrixInstance
    matrixSlots: map<Int, map<Int, Address>>;  // hash -> slotNum -> Address
    
    // Statistics
    totalUsers: Int as uint32 = 0;
    totalMatrices: Int as uint32 = 0;
    
    init(adminAddress: Address) {
        self.owner = adminAddress;
        self.users = emptyMap();
        self.userCycles = emptyMap();
        self.matrices = emptyMap();
        self.matrixSlots = emptyMap();
    }
    
    // ========================================
    // Helper Functions
    // ========================================
    
    fun levelAmount(level: Int): Int {
        if (level == 1) { return LEVEL_1; }
        if (level == 2) { return LEVEL_2; }
        if (level == 3) { return LEVEL_3; }
        if (level == 4) { return LEVEL_4; }
        if (level == 5) { return LEVEL_5; }
        if (level == 6) { return LEVEL_6; }
        if (level == 7) { return LEVEL_7; }
        if (level == 8) { return LEVEL_8; }
        if (level == 9) { return LEVEL_9; }
        if (level == 10) { return LEVEL_10; }
        return 0;
    }
    
    fun matrixKeyHash(owner: Address, level: Int, cycle: Int): Int {
        // Simple hash combining address and numbers
        let builder: Builder = beginCell();
        builder = builder.storeAddress(owner);
        builder = builder.storeUint(level, 8);
        builder = builder.storeUint(cycle, 16);
        return builder.endCell().hash();
    }
    
    fun isLevelActive(user: UserState, level: Int): Bool {
        let bit: Int = 1 << (level - 1);
        return (user.activeLevelsMask & bit) != 0;
    }
    
    fun getUserCycle(userAddr: Address, level: Int): Int {
        let userCyclesMap: map<Int, Int>? = self.userCycles.get(userAddr);
        if (userCyclesMap == null) {
            return 0;
        }
        let cycle: Int? = userCyclesMap!!.get(level);
        if (cycle == null) {
            return 0;
        }
        return cycle!!;
    }
    
    fun setUserCycle(userAddr: Address, level: Int, cycle: Int) {
        let userCyclesMap: map<Int, Int> = self.userCycles.get(userAddr) ?: emptyMap();
        userCyclesMap.set(level, cycle);
        self.userCycles.set(userAddr, userCyclesMap);
    }
    
    fun getMatrixSlot(keyHash: Int, slotNum: Int): Address? {
        let slots: map<Int, Address>? = self.matrixSlots.get(keyHash);
        if (slots == null) {
            return null;
        }
        return slots!!.get(slotNum);
    }
    
    fun setMatrixSlot(keyHash: Int, slotNum: Int, addr: Address) {
        let slots: map<Int, Address> = self.matrixSlots.get(keyHash) ?: emptyMap();
        slots.set(slotNum, addr);
        self.matrixSlots.set(keyHash, slots);
    }
    
    // ========================================
    // Core Business Logic
    // ========================================
    
    fun getOrCreateUser(addr: Address, inviter: Address): UserState {
        let existing: UserState? = self.users.get(addr);
        if (existing != null) {
            return existing!!;
        }
        
        // Create new user
        let newUser: UserState = UserState{
            inviter: inviter,
            activeLevelsMask: 0
        };
        self.users.set(addr, newUser);
        self.totalUsers = self.totalUsers + 1;
        
        // Emit event
        emit(UserRegistered{
            user: addr,
            inviter: inviter,
            timestamp: now()
        }.toCell());
        
        return newUser;
    }
    
    fun activateLevel(userAddr: Address, user: UserState, level: Int): UserState {
        let bit: Int = 1 << (level - 1);
        
        if ((user.activeLevelsMask & bit) != 0) {
            // Already active
            return user;
        }
        
        // Activate level
        let newMask: Int = user.activeLevelsMask | bit;
        let updated: UserState = UserState{
            inviter: user.inviter,
            activeLevelsMask: newMask
        };
        self.users.set(userAddr, updated);
        
        // Set cycle 1 if not present
        let currentCycle: Int = self.getUserCycle(userAddr, level);
        if (currentCycle == 0) {
            self.setUserCycle(userAddr, level, 1);
            self.createEmptyMatrix(userAddr, level, 1, user.inviter);
            
            emit(LevelActivated{
                user: userAddr,
                level: level,
                cycle: 1,
                timestamp: now()
            }.toCell());
        }
        
        return updated;
    }
    
    fun createEmptyMatrix(ownerAddr: Address, level: Int, cycle: Int, inviter: Address) {
        let keyHash: Int = self.matrixKeyHash(ownerAddr, level, cycle);
        
        let inst: MatrixInstance = MatrixInstance{
            owner: ownerAddr,
            level: level,
            cycle: cycle,
            inviter: inviter,
            nextSlot: 1
        };
        
        self.matrices.set(keyHash, inst);
        self.totalMatrices = self.totalMatrices + 1;
    }
    
    fun getMatrix(owner: Address, level: Int, cycle: Int): MatrixInstance {
        let keyHash: Int = self.matrixKeyHash(owner, level, cycle);
        let matrix: MatrixInstance? = self.matrices.get(keyHash);
        require(matrix != null, "Matrix not found");
        return matrix!!;
    }
    
    fun saveMatrix(inst: MatrixInstance) {
        let keyHash: Int = self.matrixKeyHash(inst.owner, inst.level, inst.cycle);
        self.matrices.set(keyHash, inst);
    }
    
    // ========================================
    // Placement Logic
    // ========================================
    
    fun placeInUplineMatrix(newUser: Address, inviter: Address, level: Int, contribAmount: Int) {
        // Get inviter state
        let inviterState: UserState? = self.users.get(inviter);
        require(inviterState != null, "Inviter not registered");
        
        // Check inviter has level active
        require(self.isLevelActive(inviterState!!, level), "Inviter level inactive");
        
        // Get inviter's current cycle for this level
        let inviterCycle: Int = self.getUserCycle(inviter, level);
        require(inviterCycle > 0, "Inviter cycle not found");
        
        // Get inviter's matrix
        let matrix: MatrixInstance = self.getMatrix(inviter, level, inviterCycle);
        
        require(matrix.nextSlot >= 1 && matrix.nextSlot <= 6, "Matrix full");
        
        let slotIndex: Int = matrix.nextSlot;
        let keyHash: Int = self.matrixKeyHash(inviter, level, inviterCycle);
        
        // Fill slot
        self.setMatrixSlot(keyHash, slotIndex, newUser);
        
        // Update matrix
        let updatedMatrix: MatrixInstance = MatrixInstance{
            owner: matrix.owner,
            level: matrix.level,
            cycle: matrix.cycle,
            inviter: matrix.inviter,
            nextSlot: slotIndex + 1
        };
        self.saveMatrix(updatedMatrix);
        
        // Emit event
        emit(MatrixPositionFilled{
            matrixOwner: inviter,
            level: level,
            cycle: inviterCycle,
            slotNumber: slotIndex,
            filledBy: newUser,
            timestamp: now()
        }.toCell());
        
        // Route contribution
        self.routeContributionForSlot(updatedMatrix, slotIndex, contribAmount, keyHash);
        
        // Check if matrix complete
        if (slotIndex == 6) {
            self.handleMatrixComplete(updatedMatrix);
        }
    }
    
    // ========================================
    // Reward Routing Logic
    // ========================================
    
    fun routeContributionForSlot(matrix: MatrixInstance, slotIndex: Int, amount: Int, keyHash: Int) {
        let ownerAddr: Address = matrix.owner;
        let ownerState: UserState? = self.users.get(ownerAddr);
        require(ownerState != null, "Owner not found");
        
        let level: Int = matrix.level;
        let inviterAddr: Address = matrix.inviter;
        
        if (slotIndex == 1 || slotIndex == 2) {
            // Slots 1 & 2: Send to owner's inviter (upline reward)
            if (inviterAddr != newAddress(0, 0)) {
                self.sendReward(inviterAddr, amount, "Upline reward (slot 1/2)", level);
            } else {
                self.sendReward(ownerAddr, amount, "Owner reward (no inviter)", level);
            }
            
        } else if (slotIndex == 3 || slotIndex == 4) {
            // Slots 3 & 4: 100% Direct Recurring Reward to owner
            self.sendReward(ownerAddr, amount, "Direct Recurring Reward (slot 3/4)", level);
            
        } else if (slotIndex == 5) {
            // Slot 5: Auto-upgrade logic
            if (level < MAX_LEVEL) {
                let nextLevel: Int = level + 1;
                let nextActive: Bool = self.isLevelActive(ownerState!!, nextLevel);
                
                if (!nextActive) {
                    self.autoUpgrade(ownerAddr, ownerState!!, nextLevel, amount);
                } else {
                    self.sendReward(ownerAddr, amount, "Recurring Reward (already upgraded)", level);
                }
            } else {
                self.sendReward(ownerAddr, amount, "Recurring Reward (max level)", level);
            }
            
        } else if (slotIndex == 6) {
            // Slot 6: Re-entry logic
            self.handleReentry(ownerAddr, ownerState!!, level, amount);
        }
    }
    
    fun autoUpgrade(ownerAddr: Address, ownerState: UserState, nextLevel: Int, amount: Int) {
        // Activate next level
        self.activateLevel(ownerAddr, ownerState, nextLevel);
        
        emit(AutoUpgradeTriggered{
            user: ownerAddr,
            fromLevel: nextLevel - 1,
            toLevel: nextLevel,
            timestamp: now()
        }.toCell());
        
        // Amount is consumed for upgrade (no transfer needed in this design)
        // In Jetton version, would handle Jetton transfers here
    }
    
    fun handleReentry(ownerAddr: Address, ownerState: UserState, level: Int, amount: Int) {
        let inviter: Address = ownerState.inviter;
        
        if (inviter == newAddress(0, 0)) {
            // No inviter: send back as reward
            self.sendReward(ownerAddr, amount, "Re-entry reward (no inviter)", level);
            return;
        }
        
        // Get current cycle and increment
        let currCycle: Int = self.getUserCycle(ownerAddr, level);
        let newCycle: Int = currCycle + 1;
        
        // Update cycle
        self.setUserCycle(ownerAddr, level, newCycle);
        
        // Create new empty matrix for new cycle
        self.createEmptyMatrix(ownerAddr, level, newCycle, inviter);
        
        emit(ReentryTriggered{
            user: ownerAddr,
            level: level,
            newCycle: newCycle,
            timestamp: now()
        }.toCell());
        
        // Place owner back into inviter's matrix
        self.placeInUplineMatrix(ownerAddr, inviter, level, amount);
    }
    
    fun handleMatrixComplete(matrix: MatrixInstance) {
        // Mark matrix as complete
        let completedMatrix: MatrixInstance = MatrixInstance{
            owner: matrix.owner,
            level: matrix.level,
            cycle: matrix.cycle,
            inviter: matrix.inviter,
            nextSlot: 7  // 7 indicates full
        };
        self.saveMatrix(completedMatrix);
        
        emit(MatrixCompleted{
            owner: matrix.owner,
            level: matrix.level,
            cycle: matrix.cycle,
            timestamp: now()
        }.toCell());
    }
    
    fun sendReward(to: Address, amount: Int, rewardType: String, level: Int) {
        // Deduct gas
        let sendAmount: Int = amount - MIN_GAS_AMOUNT;
        
        if (sendAmount > 0) {
            send(SendParameters{
                to: to,
                value: sendAmount,
                mode: SendIgnoreErrors,
                body: rewardType.asComment()
            });
            
            emit(RewardSent{
                recipient: to,
                amount: sendAmount,
                rewardType: rewardType,
                level: level,
                timestamp: now()
            }.toCell());
        }
    }
    
    // ========================================
    // Receive Functions
    // ========================================
    
    receive(msg: ActivateLevel) {
        let sender: Address = sender();
        let amount: Int = context().value;
        let level: Int = msg.level;
        let inviter: Address = msg.inviter;
        
        // Validate
        require(level >= 1 && level <= MAX_LEVEL, "Invalid level");
        let required: Int = self.levelAmount(level);
        require(amount >= required, "Insufficient contribution");
        
        // Get or create user
        let user: UserState = self.getOrCreateUser(sender, inviter);
        
        // Activate level
        let updatedUser: UserState = self.activateLevel(sender, user, level);
        
        // Place in inviter's matrix
        self.placeInUplineMatrix(sender, inviter, level, required);
    }
    
    receive(msg: ManualUpgrade) {
        let sender: Address = sender();
        let amount: Int = context().value;
        let level: Int = msg.level;
        
        // Validate
        require(level >= 1 && level <= MAX_LEVEL, "Invalid level");
        let required: Int = self.levelAmount(level);
        require(amount >= required, "Insufficient contribution");
        
        // Get user
        let user: UserState? = self.users.get(sender);
        require(user != null, "User not found");
        
        // Activate level (no placement)
        self.activateLevel(sender, user!!, level);
    }
    
    receive("withdraw") {
        require(sender() == self.owner, "Only owner can withdraw");
        
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance,
            body: "Withdrawal".asComment()
        });
    }
    
    // ========================================
    // Getter Functions
    // ========================================
    
    get fun getUserState(addr: Address): UserState? {
        return self.users.get(addr);
    }
    
    get fun getUserCycleForLevel(addr: Address, level: Int): Int {
        return self.getUserCycle(addr, level);
    }
    
    get fun getMatrixData(owner: Address, level: Int, cycle: Int): MatrixInstance? {
        let keyHash: Int = self.matrixKeyHash(owner, level, cycle);
        return self.matrices.get(keyHash);
    }
    
    get fun getMatrixSlots(owner: Address, level: Int, cycle: Int): map<Int, Address> {
        let keyHash: Int = self.matrixKeyHash(owner, level, cycle);
        return self.matrixSlots.get(keyHash) ?: emptyMap();
    }
    
    get fun getLevelAmount(level: Int): Int {
        return self.levelAmount(level);
    }
    
    get fun getTotalUsers(): Int {
        return self.totalUsers;
    }
    
    get fun getTotalMatrices(): Int {
        return self.totalMatrices;
    }
    
    get fun getOwner(): Address {
        return self.owner;
    }
    
    get fun isUserLevelActive(addr: Address, level: Int): Bool {
        let user: UserState? = self.users.get(addr);
        if (user == null) {
            return false;
        }
        return self.isLevelActive(user!!, level);
    }
}
