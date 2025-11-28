# How to Process SOL Payouts

## 🎯 Quick Start

When a player wins SOL, it's logged to the database as "pending". You need to run the payout processor to actually send the SOL.

### Step 1: Set Up Admin Tools

```bash
cd admin
npm install
```

### Step 2: Configure Environment

Copy your `.env` file values to `admin/.env`:

```env
WALLET=9NbdsdX8bj3GW6R1o3XJvr3DooDWcXaWGFEbWYJWzE6G
WALLET_PRIVATE_KEY=YourPrivateKeyFromPhantomHere
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
MONGODB_URI=mongodb+srv://...
```

### Step 3: Check Your Wallet Balance

```bash
cd admin
npm run check-balance
```

Should show:
```
💰 Balance: X.XXXX SOL
✅ Balance looks good!
```

### Step 4: Process Pending Payouts

```bash
npm run process-payouts
```

This will:
1. Check MongoDB for pending payouts
2. Send SOL from your WALLET to winners
3. Update database with transaction signatures
4. Keep running every 5 minutes

## 🔍 Check Current Pending Payouts

In MongoDB Compass or shell:
```javascript
db.sol_payouts.find({ status: 'pending' })
```

You should see the 0.025 SOL payout to EndD214b...

## ⚡ Process One-Time (Don't Run as Service)

If you just want to process payouts once:

```bash
cd admin
node payout-processor.js
# Press Ctrl+C after it completes
```

## 🚀 Run as Background Service (Production)

### Using PM2:
```bash
npm install -g pm2
cd admin
pm2 start payout-processor.js --name voxelroad-payouts
pm2 save
pm2 logs voxelroad-payouts  # View logs
```

### Using Screen (Linux):
```bash
screen -S payouts
cd admin
npm run process-payouts
# Press Ctrl+A then D to detach
# screen -r payouts to reattach
```

## 📋 What the Processor Does:

```
Every 5 minutes:
  ↓
Check database for status: 'pending'
  ↓
For each pending payout:
  ↓
Create Solana transaction
  FROM: WALLET (your treasury)
  TO: Player's wallet
  AMOUNT: 0.025, 0.1, or 0.25 SOL
  ↓
Send transaction
  ↓
Wait for confirmation
  ↓
Update database: status = 'completed'
  ↓
Log transaction signature
```

## 🔐 Security Note

**WALLET_PRIVATE_KEY** is your treasury's private key. This allows the processor to send SOL on your behalf.

**Keep it secure**:
- ✅ Store in `.env` (already in .gitignore)
- ✅ Never commit to git
- ✅ Never share
- ✅ Use environment variables only

## 💡 Alternative: Manual Payouts

If you don't want to run the automated processor, you can:

1. Check MongoDB daily for pending payouts
2. Manually send SOL via Phantom/Solflare
3. Manually update the database status

But automation is recommended for better user experience (instant payouts).

---

## 🎯 To Process Your Current Pending Payout:

```bash
cd admin
npm install
# Add .env file with your keys
npm run process-payouts
```

The 0.025 SOL will be sent from your WALLET to EndD214b...HDvNfB! ✅

