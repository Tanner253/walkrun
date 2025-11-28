'use client';

import dynamic from 'next/dynamic';
import WalletButton from './components/WalletButton';

const Game = dynamic(() => import('./components/Game'), {
  ssr: false,
});

export default function HomePage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Game iframe - full screen */}
      <Game />
      
      {/* Wallet button - bottom left, only on homepage */}
      <div className="wallet-container">
        <WalletButton />
      </div>
    </div>
  );
}

