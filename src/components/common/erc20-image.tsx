import Image from 'next/image'

import { UNISWAP_GITHUB_CLOUD_URL, TRUSTWALLET_GITHUB_CLOUD_URL, COINGECKO_PUBLIC_API_URL, getNetworkNameFromChainId, FALLBACK_ERC20_IMAGE_URL } from '@/utils/constants'
import { toChecksumAddress } from '@/utils/functions'
import { useState } from 'react'
import { getCoinGeckoImageURLFromTokenAddress } from '@/utils/requests';
import { Skeleton } from '../ui/skeleton';

export default function ERC20Image({tokenAddress, chainId, imageUri}: {tokenAddress: `0x${string}`, chainId: number, imageUri?: string}) {
  const networkName = getNetworkNameFromChainId(chainId);
  const UniswapURL = `${UNISWAP_GITHUB_CLOUD_URL}/${networkName}/assets/${tokenAddress ? toChecksumAddress(tokenAddress) : "ethereum"}/logo.png`;
  const TrustWalletURL = `${TRUSTWALLET_GITHUB_CLOUD_URL}/${networkName}/assets/${tokenAddress ? toChecksumAddress(tokenAddress) : "ethereum"}/logo.png`;
  const [src, setSrc] = useState(imageUri || UniswapURL);
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
        <Skeleton className='h-6 w-6 rounded-full' />
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
        className='absolute bottom-[-1px] right-[-1px] h-3 w-3 rounded-sm border border-white' 
        width={256} 
        height={256} 
        alt='NA' 
      />
    </div>
  )
}