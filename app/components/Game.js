'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from './useWallet';

export default function Game() {
  const iframeRef = useRef(null);
  const { connected, walletAddress } = useWallet();

  // Send wallet updates to game iframe
  useEffect(() => {
    if (!iframeRef.current) return;

    const sendWalletUpdate = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'WALLET_UPDATE',
          walletAddress: walletAddress,
          connected: connected
        }, '*');
        
        console.log('📤 Sent wallet update to game iframe:', {
          connected,
          wallet: walletAddress ? `${walletAddress.slice(0, 8)}...` : null
        });
      }
    };

    // Send initial update after iframe loads
    const iframe = iframeRef.current;
    const handleLoad = () => {
      console.log('✅ Game iframe loaded');
      // Send update with a small delay to ensure iframe is ready
      setTimeout(sendWalletUpdate, 500);
    };
    
    iframe.addEventListener('load', handleLoad);

    // Send update whenever wallet state changes
    if (iframe.contentWindow) {
      sendWalletUpdate();
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [connected, walletAddress]);

  return (
    <iframe 
      ref={iframeRef}
      src="/game.html"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        zIndex: 1
      }}
      title="Voxel Road - Memecoin Edition"
    />
  );
}

