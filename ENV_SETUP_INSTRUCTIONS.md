# ⚡ IMMEDIATE ACTION REQUIRED

## Add to Your `.env` File

You have:
```env
WALLET=9NbdsdX8bj3GW6R1o3XJvr3DooDWcXaWGFEbWYJWzE6G
```

**Add this line**:
```env
WALLET_PRIVATE_KEY=YourBase58PrivateKeyHere
```

## How to Get Your Private Key:

### From Phantom:
1. Open Phantom wallet
2. Click ⚙️ Settings
3. Security & Privacy
4. Export Private Key
5. Enter password
6. Copy the base58 string
7. Add to `.env` file

### Your Complete `.env` Should Look Like:
```env
WALLET=9NbdsdX8bj3GW6R1o3XJvr3DooDWcXaWGFEbWYJWzE6G
WALLET_PRIVATE_KEY=YourActualPrivateKeyBase58StringHere
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
```

## Then:

1. **Restart your dev server**:
```bash
# Stop (Ctrl+C)
npm run dev
```

2. **Win a SOL gem again** - it will be sent automatically! ✅

3. **Check your wallet** - you'll see the transaction

## 🔐 Security:

- ✅ `.env` is already in `.gitignore`
- ✅ NEVER commit this file
- ✅ Keep private key secret
- ✅ This allows automatic SOL transfers

Once you add `WALLET_PRIVATE_KEY` and restart, SOL payouts will be **instant and automatic**! 🚀

