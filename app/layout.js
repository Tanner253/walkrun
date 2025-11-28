import "./globals.css";
import { SolanaWalletProvider } from "./components/WalletProvider";

export const metadata = {
  title: "Voxel Road - Memecoin Edition",
  description: "Play Voxel Road, collect characters, win SOL prizes!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js"></script>
      </head>
      <body>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}

