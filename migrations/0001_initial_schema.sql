-- Initial schema for 2×2 Community Matrix on TON
-- 10 Contribution Levels with Auto-Upgrade and Re-entry

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  member_code TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  country TEXT,
  ton_wallet_address TEXT,
  ton_network TEXT DEFAULT 'testnet' CHECK(ton_network IN ('testnet', 'mainnet')),
  referred_by_id INTEGER,
  is_admin INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (referred_by_id) REFERENCES users(id)
);

-- Matrix Levels table (10 levels)
CREATE TABLE IF NOT EXISTS matrix_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level INTEGER NOT NULL UNIQUE,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USDT-TON' NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert the 10 contribution levels
INSERT INTO matrix_levels (level, amount) VALUES
  (1, 5),
  (2, 10),
  (3, 20),
  (4, 40),
  (5, 80),
  (6, 160),
  (7, 320),
  (8, 640),
  (9, 1280),
  (10, 2560);

-- Matrix Instances table (one per user per level per cycle)
CREATE TABLE IF NOT EXISTS matrix_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  level_id INTEGER NOT NULL,
  cycle_number INTEGER DEFAULT 1 NOT NULL,
  status TEXT DEFAULT 'OPEN' NOT NULL CHECK(status IN ('OPEN', 'FILLED')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (level_id) REFERENCES matrix_levels(id)
);

-- Matrix Positions table (6 positions per matrix instance)
CREATE TABLE IF NOT EXISTS matrix_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matrix_instance_id INTEGER NOT NULL,
  slot_number INTEGER NOT NULL CHECK(slot_number BETWEEN 1 AND 6),
  filled_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  filled_at TEXT,
  FOREIGN KEY (matrix_instance_id) REFERENCES matrix_instances(id),
  FOREIGN KEY (filled_by_user_id) REFERENCES users(id)
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  level_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USDT-TON' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK(status IN ('pending', 'confirmed', 'failed')),
  tx_hash TEXT,
  network TEXT DEFAULT 'testnet' NOT NULL CHECK(network IN ('testnet', 'mainnet')),
  matrix_instance_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (level_id) REFERENCES matrix_levels(id),
  FOREIGN KEY (matrix_instance_id) REFERENCES matrix_instances(id)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  level_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('DIRECT', 'UPGRADE', 'REENTRY', 'REFERRAL')),
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USDT-TON' NOT NULL,
  description TEXT NOT NULL,
  contribution_id INTEGER,
  matrix_instance_id INTEGER,
  from_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (level_id) REFERENCES matrix_levels(id),
  FOREIGN KEY (contribution_id) REFERENCES contributions(id),
  FOREIGN KEY (matrix_instance_id) REFERENCES matrix_instances(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id)
);

-- User Level Activations table
CREATE TABLE IF NOT EXISTS user_level_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  level_id INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  activated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (level_id) REFERENCES matrix_levels(id),
  UNIQUE(user_id, level_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_member_code ON users(member_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_id);

CREATE INDEX IF NOT EXISTS idx_matrix_instances_user ON matrix_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_matrix_instances_level ON matrix_instances(level_id);
CREATE INDEX IF NOT EXISTS idx_matrix_instances_status ON matrix_instances(status);

CREATE INDEX IF NOT EXISTS idx_matrix_positions_instance ON matrix_positions(matrix_instance_id);
CREATE INDEX IF NOT EXISTS idx_matrix_positions_filled_by ON matrix_positions(filled_by_user_id);
CREATE INDEX IF NOT EXISTS idx_matrix_positions_slot ON matrix_positions(slot_number);

CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_level ON contributions(level_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);

CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_level ON rewards(level_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);

CREATE INDEX IF NOT EXISTS idx_user_level_activations_user ON user_level_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_activations_level ON user_level_activations(level_id);
