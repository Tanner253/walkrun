import { NextResponse } from 'next/server';
import { getOrCreateUser } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser(walletAddress);
    
    return NextResponse.json({
      highScore: user.highScore,
      coins: user.coins,
      unlockedChars: user.unlockedChars,
      selectedChar: user.selectedChar,
    });
  } catch (error) {
    console.error('Load user error:', error);
    return NextResponse.json(
      { error: 'Failed to load user data' },
      { status: 500 }
    );
  }
}

