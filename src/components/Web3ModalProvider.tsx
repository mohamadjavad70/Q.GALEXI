'use client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config } from '../lib/wagmi'

const queryClient = new QueryClient()

createWeb3Modal({
  wagmiConfig: config,
  projectId: '65ce1147a0478432779cb496db8f3fa5',
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#f59e0b',
  },
})

export function Web3ModalProvider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
