import Image from 'next/image'

import { UNISWAP_GITHUB_CLOUD_URL, getNetworkNameFromChainId, FALLBACK_ERC20_IMAGE_URL } from '@/utils/constants'
import { toChecksumAddress } from '@/utils/functions'
import { useState } from 'react'

export default function ERC20Image({tokenAddress, chainId}: {tokenAddress: `0x${string}`, chainId: number}) {
  const networkName = getNetworkNameFromChainId(chainId)
  const [src, setSrc] = useState(`${UNISWAP_GITHUB_CLOUD_URL}/${networkName}/assets/${tokenAddress ? toChecksumAddress(tokenAddress) : "ethereum"}/logo.png`)
  return (
    <Image src={src} className='h-4 w-4 rounded-full self-center' width={256} height={256} alt='NA' onError={() => setSrc(FALLBACK_ERC20_IMAGE_URL)} />
  )
}