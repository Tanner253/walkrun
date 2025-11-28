# Admin Tools - Voxel Road

This folder contains administrative tools for managing SOL payouts.

## 🔧 Setup

### 1. Install Dependencies

From the `admin` folder:
```bash
npm install
```

### 2. Configure Environment

The scripts use environment variables from the parent `.env.local` file:

**Required Variables**:
```env
WALLET=YourPlatformWalletPublicAddress
WALLET_PRIVATE_KEY=YourPlatformWalletPrivateKey
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
MONGODB_URI=mongodb+srv://...
```

## 📜 Scripts

### Check Platform Wallet Balance

```bash
npm run check-balance
```

Shows:
- Current SOL balance
- USD value (@ $100 and $200/SOL)
- How many payouts you can cover
- Low balance warnings

### Run Payout Processor

```bash
npm run process-payouts
```

Features:
- Checks for pending payouts every 5 minutes
- Transfers SOL from `WALLET` to winners
- Updates database with transaction signatures
- Logs all activity
- Handles errors gracefully

## 💰 The WALLET Variable

`WALLET` = Your platform treasury wallet address

**This wallet**:
- Holds SOL to pay prize winners
- Is charged when SOL gems are won
- Must be funded by you
- Should be monitored regularly

**Payout Flow**:
```
Player wins 0.025 SOL gem
  ↓
Logged to database (status: 'pending')
  ↓
Payout processor runs
  ↓
Transfer: WALLET → Player's Wallet
  ↓
WALLET balance decreases by 0.025 SOL
  ↓
Database updated (status: 'completed')
```

## 🚀 Running in Production

### Option 1: PM2 (Recommended)

```bash
npm install -g pm2
pm2 start payout-processor.js --name voxelroad-payouts
pm2 save
pm2 startup
```

### Option 2: Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "payout-processor.js"]
```

### Option 3: Cron Job

```bash
# Check every 5 minutes
*/5 * * * * cd /path/to/admin && node payout-processor.js >> payouts.log 2>&1
```

## 📊 Monitoring

### View Pending Payouts

In MongoDB shell:
```javascript
db.sol_payouts.find({ status: 'pending' })
```

### View Completed Payouts

```javascript
db.sol_payouts.find({ status: 'completed' }).sort({ completedAt: -1 }).limit(10)
```

### Total SOL Paid Out

```javascript
db.sol_payouts.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
])
```

### Failed Payouts

```javascript
db.sol_payouts.find({ status: 'failed' })
```

## 🔐 Security

**NEVER**:
- ❌ Commit `WALLET_PRIVATE_KEY` to git
- ❌ Share private key with anyone
- ❌ Expose private key in client code
- ❌ Store private key in database

**DO**:
- ✅ Use environment variables only
- ✅ Keep private key in secure vault
- ✅ Use different wallet for platform vs personal
- ✅ Monitor wallet balance regularly
- ✅ Set up low-balance alerts

## 💡 Tips

1. **Test on Devnet First**: Use devnet SOL before mainnet
2. **Start Small**: Fund with 1-2 SOL initially
3. **Monitor Daily**: Check balance and pending payouts
4. **Auto-alerts**: Set up notifications for low balance
5. **Backup**: Keep backup of private key in secure location

## 🆘 Emergency

If payout processor fails:
1. Check logs for error messages
2. Verify wallet has sufficient balance
3. Check MongoDB connection
4. Verify RPC endpoint is working
5. Manually process urgent payouts via Phantom

---

📧 Questions? See PLATFORM_WALLET_SETUP.md for more details.

