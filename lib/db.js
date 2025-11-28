import clientPromise from './mongodb';

export async function getDatabase() {
  const client = await clientPromise;
  return client.db('voxelroad');
}

export async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection('users');
}

/**
 * Get or create user by wallet address
 */
export async function getOrCreateUser(walletAddress) {
  const users = await getUsersCollection();
  
  let user = await users.findOne({ walletAddress });
  
  if (!user) {
    // Create new user with default values
    user = {
      walletAddress,
      highScore: 0,
      coins: 0,
      unlockedChars: ['chicken'],
      selectedChar: 'chicken',
      createdAt: new Date(),
      lastPlayed: new Date(),
    };
    
    await users.insertOne(user);
    console.log(`✨ New user created: ${walletAddress.slice(0, 8)}...`);
  }
  
  return user;
}

/**
 * Update user data
 */
export async function updateUser(walletAddress, updates) {
  const users = await getUsersCollection();
  
  const result = await users.updateOne(
    { walletAddress },
    { 
      $set: {
        ...updates,
        lastPlayed: new Date()
      }
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit = 10) {
  const users = await getUsersCollection();
  
  return users
    .find({})
    .sort({ highScore: -1 })
    .limit(limit)
    .project({ walletAddress: 1, highScore: 1, _id: 0 })
    .toArray();
}

/**
 * Log SOL payout (for tracking)
 */
export async function logSolPayout(walletAddress, amount, txSignature) {
  const db = await getDatabase();
  const payouts = db.collection('sol_payouts');
  
  await payouts.insertOne({
    walletAddress,
    amount,
    txSignature,
    timestamp: new Date(),
    status: 'pending'
  });
}

/**
 * Update payout status
 */
export async function updatePayoutStatus(txSignature, status) {
  const db = await getDatabase();
  const payouts = db.collection('sol_payouts');
  
  await payouts.updateOne(
    { txSignature },
    { $set: { status, updatedAt: new Date() } }
  );
}

