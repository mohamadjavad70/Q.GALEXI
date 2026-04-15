'use client'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export default function ConnectWalletButton() {
  const { open } = useWeb3Modal()
  return (
    <button
      onClick={() => open()}
      className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded"
    >
      🔌 اتصال کیف پول
    </button>
  )
}
