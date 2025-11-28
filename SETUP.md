# Setup Guide - Voxel Road with Solana & MongoDB

This guide will help you set up the game with Solana wallet integration and MongoDB backend.

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Solana wallet (Phantom or Solflare) for testing

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Solana wallet adapters (Phantom & Solflare)
- MongoDB driver
- Next.js and Three.js dependencies

### 2. Set Up MongoDB

1. **Create MongoDB Atlas Account**:
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create a free cluster

2. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

3. **Create Database**:
   - Database name: `voxelroad`
   - Collections (auto-created):
     - `users` - Player data
     - `sol_payouts` - SOL payout tracking

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Your MongoDB connection string
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/voxelroad?retryWrites=true&w=majority

# Solana RPC (optional - defaults to public mainnet)
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
```

**For Development/Testing**, use devnet:
```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

### 4. Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Test Wallet Connection

1. Open the game
2. Click "Connect Wallet" button (top right)
3. Select Phantom or Solflare
4. Approve connection
5. Your game data will now save to MongoDB!

## Database Schema

### User Document
```javascript
{
  walletAddress: String,    // Solana wallet address (primary key)
  highScore: Number,        // Best distance achieved
  coins: Number,            // Total gold balance
  unlockedChars: [String],  // Array of unlocked character IDs
  selectedChar: String,     // Currently equipped character
  createdAt: Date,          // Account creation timestamp
  lastPlayed: Date          // Last game session
}
```

### SOL Payout Document
```javascript
{
  walletAddress: String,    // Recipient wallet
  amount: Number,           // SOL amount (0.5 for cosmic)
  txSignature: String,      // Transaction signature
  timestamp: Date,          // Request time
  status: String,           // 'pending' | 'completed' | 'failed'
  type: String              // 'cosmic' | 'mythic' | 'legendary'
}
```

## Features

### ✅ Implemented
- [x] Solana wallet connection (Phantom & Solflare)
- [x] MongoDB data persistence
- [x] Wallet-based user accounts
- [x] API routes for save/load
- [x] SOL payout request logging
- [x] Guest mode (play without wallet)
- [x] Auto-save every 30 seconds
- [x] Cosmic prize = 0.5 SOL

### 🚧 To Implement (Admin)
- [ ] Automated SOL payout processor
- [ ] Admin dashboard for payout management
- [ ] Transaction monitoring
- [ ] Leaderboard UI

## SOL Payout System

### How It Works

1. **Player Wins SOL Prize**:
   - Cosmic character unlock (0.5 SOL)
   - Payout request logged to `sol_payouts` collection

2. **Admin Processes Payouts** (Manual for now):
   - View pending payouts in MongoDB
   - Send SOL using Solana CLI or custom script
   - Update payout status to 'completed'

### Future: Automated Payouts

Create a backend service that:
```javascript
// Pseudo-code for automated payout processor
async function processPendingPayouts() {
  const pending = await getPayouts({ status: 'pending' });
  
  for (const payout of pending) {
    try {
      const tx = await sendSOL(payout.walletAddress, payout.amount);
      await updatePayoutStatus(payout._id, 'completed', tx.signature);
    } catch (error) {
      await updatePayoutStatus(payout._id, 'failed', error.message);
    }
  }
}
```

## Security Notes

1. **Never commit `.env.local`** - Contains MongoDB credentials
2. **Use MongoDB IP whitelist** - Restrict access to your IPs
3. **Rotate credentials regularly** - Update MongoDB password periodically
4. **Monitor payout requests** - Check for suspicious activity
5. **Rate limit API routes** - Prevent abuse

## Testing Checklist

- [ ] Wallet connects successfully
- [ ] Data saves to MongoDB when connected
- [ ] Data loads on reconnection
- [ ] Guest mode works without wallet
- [ ] High scores update correctly
- [ ] Character unlocks persist
- [ ] SOL payout requests are logged

## Troubleshooting

### Wallet Won't Connect
- Check browser console for errors
- Ensure wallet extension is installed
- Try incognito/private mode
- Verify RPC endpoint is accessible

### MongoDB Connection Failed
- Check `.env.local` has correct URI
- Verify IP whitelist in MongoDB Atlas
- Ensure database user has read/write permissions

### Data Not Saving
- Check browser console for API errors
- Verify MongoDB connection in API logs
- Ensure wallet is connected
- Check `/api/user/save` response

## Environment URLs

### Development
- Game: `http://localhost:3000`
- API: `http://localhost:3000/api/*`

### Production (Vercel)
- Game: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/*`

## Next Steps

1. ✅ Complete setup above
2. Test wallet integration
3. Implement SOL payout processor
4. Add leaderboard UI
5. Deploy to Vercel

---

🎮 Questions? Check the main README.md or create an issue on GitHub.

