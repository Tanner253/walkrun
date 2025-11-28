import { NextResponse } from 'next/server';
import { updateUser } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { walletAddress, highScore, coins, unlockedChars, selectedChar } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const updates = {};
    
    if (typeof highScore === 'number') updates.highScore = highScore;
    if (typeof coins === 'number') updates.coins = coins;
    if (Array.isArray(unlockedChars)) updates.unlockedChars = unlockedChars;
    if (selectedChar) updates.selectedChar = selectedChar;

    const success = await updateUser(walletAddress, updates);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Save user error:', error);
    return NextResponse.json(
      { error: 'Failed to save user data' },
      { status: 500 }
    );
  }
}

