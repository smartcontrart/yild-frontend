import Image from 'next/image'
import { TRUST_WALLET_GITHUB_CLOUD_URL, getNetworkNameFromChainId } from '@/utils/constants'
import { toChecksumAddress } from '@/utils/functions'

export default function ERC20Image({tokenAddress, chainId}: {tokenAddress: `0x${string}`, chainId: number}) {
  const networkName = getNetworkNameFromChainId(chainId)

  return (
    <Image src={`${TRUST_WALLET_GITHUB_CLOUD_URL}/${networkName}/assets/${toChecksumAddress(tokenAddress)}/logo.png`} className='h-4 w-4' width={256} height={256} alt='NA' />
  )
}