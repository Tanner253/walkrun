'use client';

import { useWallet } from './useWallet';
import { useEffect, useState } from 'react';

export default function WalletButton() {
  const { connected, walletAddress, connecting, connect, disconnect, mounted } = useWallet();
  const [showTooltip, setShowTooltip] = useState(false);

  // Send wallet updates to game iframe
  useEffect(() => {
    if (!mounted) return;

    const sendUpdate = () => {
      const gameFrame = document.querySelector('iframe[title="Voxel Road - Memecoin Edition"]');
      if (gameFrame && gameFrame.contentWindow) {
        gameFrame.contentWindow.postMessage({
          type: 'WALLET_UPDATE',
          walletAddress: walletAddress,
          connected: connected
        }, '*');
        
        console.log('📤 Sent wallet update to game:', {
          connected,
          wallet: walletAddress ? `${walletAddress.slice(0, 8)}...` : null
        });
      }
    };

    const timer = setTimeout(sendUpdate, 100);
    return () => clearTimeout(timer);
  }, [connected, walletAddress, mounted]);

  if (!mounted) {
    return (
      <div className="wallet-icon-button wallet-loading">
        <span className="wallet-icon-emoji">⏳</span>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="wallet-icon-button wallet-connecting">
        <span className="wallet-icon-emoji">🔄</span>
      </div>
    );
  }

  if (connected && walletAddress) {
    return (
      <div 
        className="wallet-icon-button wallet-connected"
        onClick={disconnect}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={walletAddress}
      >
        <span className="wallet-icon-emoji">👛</span>
        {showTooltip && (
          <div className="wallet-tooltip">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            <div className="wallet-tooltip-hint">Click to disconnect</div>
          </div>
        )}
        <div className="wallet-status-indicator"></div>
      </div>
    );
  }

  return (
    <div 
      className="wallet-icon-button wallet-disconnected"
      onClick={connect}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="wallet-icon-emoji">🔗</span>
      {showTooltip && (
        <div className="wallet-tooltip">
          Connect Wallet
          <div className="wallet-tooltip-hint">Save your progress</div>
        </div>
      )}
    </div>
  );
}

