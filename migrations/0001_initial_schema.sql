-- Initial schema for 2×2 Community Matrix on TON

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
  referred_by_id INTEGER REFERENCES users(id),
  is_admin INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Matrix Positions table
CREATE TABLE IF NOT EXISTS matrix_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  position_index INTEGER NOT NULL,
  filled_by_user_id INTEGER REFERENCES users(id),
  parent_position_id INTEGER REFERENCES matrix_positions(id),
  level INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'TON' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK(status IN ('pending', 'confirmed', 'failed')),
  tx_hash TEXT,
  network TEXT DEFAULT 'testnet' NOT NULL CHECK(network IN ('testnet', 'mainnet')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('REFERRAL', 'MATRIX', 'COMMUNITY')),
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'TON' NOT NULL,
  description TEXT NOT NULL,
  contribution_id INTEGER REFERENCES contributions(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_member_code ON users(member_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_id);
CREATE INDEX IF NOT EXISTS idx_matrix_positions_owner ON matrix_positions(owner_id);
CREATE INDEX IF NOT EXISTS idx_matrix_positions_filled_by ON matrix_positions(filled_by_user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
