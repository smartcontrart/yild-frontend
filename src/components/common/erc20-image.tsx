import Image from 'next/image'

import { UNISWAP_GITHUB_CLOUD_URL, TRUSTWALLET_GITHUB_CLOUD_URL, COINGECKO_PUBLIC_API_URL, getNetworkNameFromChainId, FALLBACK_ERC20_IMAGE_URL } from '@/utils/constants'
import { toChecksumAddress } from '@/utils/functions'
import { useState } from 'react'
import { getCoinGeckoImageURLFromTokenAddress } from '@/utils/requests';

export default function ERC20Image({tokenAddress, chainId}: {tokenAddress: `0x${string}`, chainId: number}) {
  const networkName = getNetworkNameFromChainId(chainId);
  const UniswapURL = `${UNISWAP_GITHUB_CLOUD_URL}/${networkName}/assets/${tokenAddress ? toChecksumAddress(tokenAddress) : "ethereum"}/logo.png`;
  const TrustWalletURL = `${TRUSTWALLET_GITHUB_CLOUD_URL}/${networkName}/assets/${tokenAddress ? toChecksumAddress(tokenAddress) : "ethereum"}/logo.png`;
  const [src, setSrc] = useState(UniswapURL);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0)

  const findFromCoinGecko = async () => {
    const imgUrl = await getCoinGeckoImageURLFromTokenAddress(tokenAddress, chainId)
    if (imgUrl)
      setSrc(imgUrl)
  }

  return (
    <div className='relative h-6 w-6'>
      {loading && (
        <div className="absolute top-0 left-0 h-6 w-6 flex items-center justify-center z-2">
          <div className="animate-spin rounded-full h-6 w-6 border-8 border-[#53A924] border-t-transparent" />
        </div>
      )}
      <Image 
        src={src} 
        className='rounded-full self-center' 
        width={256} 
        height={256} 
        alt='NA' 
        onLoad={() => setLoading(false)}
        onError={() => {
          if (errorCount === 0)
            setSrc(TrustWalletURL)
          else if (errorCount === 1)
            findFromCoinGecko()
          else
            setSrc(FALLBACK_ERC20_IMAGE_URL)
          setErrorCount(errorCount + 1)
        }} 
      />
      <Image 
        src={`/chainIcons/${chainId}.png`} 
        className='absolute bottom-0 right-0 h-3 w-3 rounded-sm border border-white' 
        width={256} 
        height={256} 
        alt='NA' 
      />
    </div>
  )
}