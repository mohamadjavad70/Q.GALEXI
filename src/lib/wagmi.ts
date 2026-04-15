import { createConfig, http } from 'wagmi'
import { mainnet, bsc } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

const projectId = '65ce1147a0478432779cb496db8f3fa5'

export const config = createConfig({
  chains: [bsc, mainnet],
  connectors: [walletConnect({ projectId })],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http(),
  },
})
