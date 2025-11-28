import { NextResponse } from 'next/server';
import { logSolPayout, updatePayoutStatus } from '../../../../lib/db';
import { Connection, Keypair, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

export async function POST(request) {
  try {
    const { walletAddress, amount, type } = await request.json();

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Wallet address and amount required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.WALLET_PRIVATE_KEY) {
      console.error('❌ WALLET_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Platform wallet not configured' },
        { status: 500 }
      );
    }

    console.log(`💰 SOL Payout requested: ${amount} SOL to ${walletAddress.slice(0, 8)}...`);
    console.log(`   Type: ${type}`);
    
    try {
      // Initialize Solana connection
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com', 'confirmed');
      
      // Load platform wallet from private key - send SOL from this wallet to winner
      const platformWallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY));
      
      console.log(`   📤 Sending from platform wallet: ${platformWallet.publicKey.toBase58().slice(0, 8)}...`);
      
      // Validate recipient address
      const recipientPubkey = new PublicKey(walletAddress);
      
      // Check platform wallet balance
      const balance = await connection.getBalance(platformWallet.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      console.log(`   💰 Platform wallet balance: ${balanceSOL.toFixed(4)} SOL`);
      
      const amountLamports = Math.floor(amount * LAMPORTS_PER_SOL);
      if (balance < amountLamports + 5000) {
        throw new Error(`Insufficient balance. Have ${balanceSOL} SOL, need ${amount} SOL + fees`);
      }
      
      // Create and send transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: platformWallet.publicKey,
          toPubkey: recipientPubkey,
          lamports: amountLamports
        })
      );
      
      const signature = await connection.sendTransaction(transaction, [platformWallet]);
      console.log(`   📤 Transaction sent: ${signature}`);
      
      // Wait for confirmation using polling (RPC doesn't support WebSocket)
      console.log(`   ⏳ Waiting for confirmation...`);
      
      // Poll for confirmation instead of using WebSocket subscription
      let confirmed = false;
      for (let i = 0; i < 30; i++) { // Try for 30 seconds
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const status = await connection.getSignatureStatus(signature);
        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
          confirmed = true;
          break;
        }
        
        if (status?.value?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
      }
      
      if (!confirmed) {
        // Transaction sent but confirmation timed out - still log it
        console.log(`   ⚠️ Confirmation timeout, but transaction was sent`);
      } else {
        console.log(`   ✅ Transaction confirmed!`);
      }
      
      // Log to database with completed status
      await logSolPayout(walletAddress, amount, signature, 'completed', type);
      
      console.log(`   🎉 Successfully paid ${amount} SOL to ${walletAddress.slice(0, 8)}...`);
      
      return NextResponse.json({
        success: true,
        message: `${amount} SOL sent successfully!`,
        txSignature: signature,
        amount,
        explorerUrl: `https://solscan.io/tx/${signature}`
      });
      
    } catch (transferError) {
      console.error('❌ Failed to send SOL:', transferError);
      
      // Log as failed payout
      const failedTxId = `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await logSolPayout(walletAddress, amount, failedTxId, 'failed', type);
      
      return NextResponse.json({
        success: false,
        error: `Failed to send SOL: ${transferError.message}`,
        amount,
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Payout request error:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}


