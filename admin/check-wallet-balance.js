/**
 * Quick script to check platform wallet balance
 * 
 * Usage: node admin/check-wallet-balance.js
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: '../.env.local' });

if (!process.env.WALLET) {
  console.error('❌ WALLET environment variable not set');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SOLANA_RPC) {
  console.error('❌ NEXT_PUBLIC_SOLANA_RPC environment variable not set');
  process.exit(1);
}

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC, 'confirmed');
const walletAddress = new PublicKey(process.env.WALLET);

async function checkBalance() {
  try {
    console.log('🔍 Checking platform wallet balance...\n');
    console.log(`Wallet: ${walletAddress.toBase58()}\n`);
    
    const balance = await connection.getBalance(walletAddress);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💰 Balance: ${balanceSOL.toFixed(6)} SOL`);
    console.log(`💵 Value @ $100/SOL: $${(balanceSOL * 100).toFixed(2)}`);
    console.log(`💵 Value @ $200/SOL: $${(balanceSOL * 200).toFixed(2)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Estimate how many payouts this can cover
    const estimatedSmallGems = Math.floor(balanceSOL / 0.025);
    const estimatedMediumGems = Math.floor(balanceSOL / 0.1);
    const estimatedLargeGems = Math.floor(balanceSOL / 0.25);
    
    console.log('📊 Can cover approximately:');
    console.log(`   ${estimatedSmallGems} small SOL gems (0.025 each)`);
    console.log(`   ${estimatedMediumGems} medium SOL gems (0.1 each)`);
    console.log(`   ${estimatedLargeGems} large SOL gems (0.25 each)\n`);
    
    // Warnings
    if (balanceSOL < 0.5) {
      console.warn('⚠️  CRITICAL: Balance very low! Refill immediately.\n');
    } else if (balanceSOL < 1.0) {
      console.warn('⚠️  WARNING: Balance below 1 SOL. Consider refilling soon.\n');
    } else if (balanceSOL < 2.0) {
      console.log('ℹ️  NOTICE: Balance below 2 SOL. Monitor closely.\n');
    } else {
      console.log('✅ Balance looks good!\n');
    }
    
  } catch (error) {
    console.error('❌ Failed to check balance:', error.message);
    process.exit(1);
  }
}

checkBalance();

