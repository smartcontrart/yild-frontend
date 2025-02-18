import { ApolloClient, InMemoryCache } from "@apollo/client";
import { SUBGRAPH_API_KEY } from "@/utils/constants"

export const mainnetClient = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
  cache: new InMemoryCache(),
});

export const arbitrumClient = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/FQ6JYszEKApsBpAmiHesRsd9Ygc6mzmpNRANeVQFYoVX`,
  cache: new InMemoryCache(),
});

export const baseClient = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/43Hwfi3dJSoGpyas9VwNoDAv55yjgGrPpNSmbQZArzMG`,
  cache: new InMemoryCache(),
});

export const getClientFromChainId = (chainId: number) => {
  if (chainId === 1) 
    return mainnetClient
  if (chainId === 8453)
    return baseClient
  if (chainId === 42161)
    return arbitrumClient
  return mainnetClient
}
