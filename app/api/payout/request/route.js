import { NextResponse } from 'next/server';
import { logSolPayout } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { walletAddress, amount, type } = await request.json();

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Wallet address and amount required' },
        { status: 400 }
      );
    }

    // Generate a temporary transaction ID
    const tempTxId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log the payout request
    await logSolPayout(walletAddress, amount, tempTxId);
    
    console.log(`💰 SOL Payout requested: ${amount} SOL to ${walletAddress.slice(0, 8)}...`);
    console.log(`   Type: ${type}`);
    console.log(`   Pending TX: ${tempTxId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Payout request logged. SOL will be sent shortly.',
      pendingTxId: tempTxId,
      amount,
    });
  } catch (error) {
    console.error('Payout request error:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}

