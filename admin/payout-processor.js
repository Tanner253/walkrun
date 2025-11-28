/**
 * Automated SOL Payout Processor
 * 
 * This script processes pending SOL payouts from the prize machine.
 * It transfers SOL from the platform wallet (WALLET env var) to winners.
 * 
 * Run this as a background service:
 * node admin/payout-processor.js
 */

import { Connection, Keypair, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { getDatabase } from '../lib/mongodb.js';

// Validate required environment variables
if (!process.env.WALLET) {
  throw new Error('❌ WALLET environment variable not set (platform treasury address)');
}

if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error('❌ WALLET_PRIVATE_KEY environment variable not set');
}

if (!process.env.NEXT_PUBLIC_SOLANA_RPC) {
  throw new Error('❌ NEXT_PUBLIC_SOLANA_RPC environment variable not set');
}

// Initialize Solana connection
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC, 'confirmed');

// Load platform treasury wallet from private key
// This wallet pays out SOL to prize winners
const platformWallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY));

console.log('🚀 Voxel Road Payout Processor Started');
console.log(`💰 Platform Treasury Wallet (WALLET): ${platformWallet.publicKey.toBase58()}`);
console.log(`🔗 RPC Endpoint: ${process.env.NEXT_PUBLIC_SOLANA_RPC}`);

// Verify WALLET address matches the private key
if (platformWallet.publicKey.toBase58() !== process.env.WALLET) {
  console.error('⚠️ CRITICAL ERROR: WALLET and WALLET_PRIVATE_KEY do not match!');
  console.error(`   WALLET env var: ${process.env.WALLET}`);
  console.error(`   Derived from private key: ${platformWallet.publicKey.toBase58()}`);
  console.error('   These must match for payouts to work correctly.');
  process.exit(1);
}

console.log('✅ Wallet validation passed\n');

/**
 * Process all pending SOL payouts
 */
async function processPendingPayouts() {
  try {
    const client = await getDatabase();
    const db = client.db('voxelroad');
    const payouts = db.collection('sol_payouts');
    
    // Get all pending payouts
    const pending = await payouts.find({ status: 'pending' }).toArray();
    
    if (pending.length === 0) {
      console.log('✅ No pending payouts');
      return;
    }
    
    console.log(`\n📋 Processing ${pending.length} pending payout(s)...`);
    
    // Check platform wallet balance first
    const balance = await connection.getBalance(platformWallet.publicKey);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    console.log(`💰 Platform wallet balance: ${balanceSOL.toFixed(4)} SOL`);
    
    for (const payout of pending) {
      try {
        console.log(`\n🔄 Processing payout ${payout._id}:`);
        console.log(`   Recipient: ${payout.walletAddress}`);
        console.log(`   Amount: ${payout.amount} SOL`);
        console.log(`   Type: ${payout.type || 'Unknown'}`);
        
        // Validate recipient address
        let recipientPubkey;
        try {
          recipientPubkey = new PublicKey(payout.walletAddress);
        } catch (e) {
          throw new Error(`Invalid recipient wallet address: ${payout.walletAddress}`);
        }
        
        // Check if we have enough balance
        const amountLamports = Math.floor(payout.amount * LAMPORTS_PER_SOL);
        if (balance < amountLamports + 5000) { // 5000 lamports for fee
          throw new Error(`Insufficient balance. Have ${balanceSOL} SOL, need ${payout.amount} SOL + fees`);
        }
        
        // Create transfer transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: platformWallet.publicKey,
            toPubkey: recipientPubkey,
            lamports: amountLamports
          })
        );
        
        // Send and confirm transaction
        const signature = await connection.sendTransaction(transaction, [platformWallet]);
        console.log(`   📤 Transaction sent: ${signature}`);
        
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(`   ✅ Transaction confirmed!`);
        
        // Update database with completed status
        await payouts.updateOne(
          { _id: payout._id },
          { 
            $set: { 
              status: 'completed',
              txSignature: signature,
              completedAt: new Date(),
              platformWallet: platformWallet.publicKey.toBase58()
            }
          }
        );
        
        console.log(`   💾 Database updated: COMPLETED`);
        console.log(`   🎉 Successfully paid ${payout.amount} SOL to ${payout.walletAddress.slice(0, 8)}...`);
        
      } catch (error) {
        console.error(`   ❌ Failed to process payout ${payout._id}:`, error.message);
        
        // Mark as failed in database
        await payouts.updateOne(
          { _id: payout._id },
          { 
            $set: { 
              status: 'failed',
              error: error.message,
              failedAt: new Date()
            }
          }
        );
        
        console.log(`   💾 Database updated: FAILED`);
      }
    }
    
    console.log(`\n✅ Payout processing complete\n`);
    
  } catch (error) {
    console.error('❌ Fatal error in payout processor:', error);
  }
}

/**
 * Monitor platform wallet balance
 */
async function checkBalance() {
  try {
    const balance = await connection.getBalance(platformWallet.publicKey);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    console.log(`\n💰 Platform Wallet Balance: ${balanceSOL.toFixed(4)} SOL ($${(balanceSOL * 200).toFixed(2)} @ $200/SOL)`);
    
    // Warning if balance is low
    if (balanceSOL < 1.0) {
      console.warn('⚠️ WARNING: Platform wallet balance below 1 SOL!');
      console.warn('   Please refill to continue paying out winners.');
    } else if (balanceSOL < 2.0) {
      console.warn('⚠️ NOTICE: Platform wallet balance below 2 SOL. Consider refilling soon.');
    }
    
    return balanceSOL;
  } catch (error) {
    console.error('❌ Failed to check balance:', error);
    return 0;
  }
}

// Run processor every 5 minutes
console.log('⏰ Will check for pending payouts every 5 minutes\n');
setInterval(async () => {
  await processPendingPayouts();
  await checkBalance();
}, 5 * 60 * 1000);

// Run immediately on startup
(async () => {
  await checkBalance();
  await processPendingPayouts();
})();

