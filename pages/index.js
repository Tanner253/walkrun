import { useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'

// Import the game component only on client-side
const Game = dynamic(() => import('../components/Game'), {
  ssr: false,
})

export default function Home() {
  return (
    <>
      <Head>
        <title>Voxel Road - Memecoin Edition</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="description" content="Voxel Road - Memecoin Edition" />
      </Head>
      <Game />
    </>
  )
}

