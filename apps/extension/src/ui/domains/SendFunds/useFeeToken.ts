import { useMemo } from "react"

import { useChain, useEvmNetwork, useToken } from "@ui/state"

export const useFeeToken = (tokenId?: string | null) => {
  const token = useToken(tokenId)
  const chain = useChain(token?.chain?.id)
  const evmNetwork = useEvmNetwork(token?.evmNetwork?.id)

  const feeTokenId = useMemo(() => {
    if (!token) return null

    if (typeof chain?.feeToken === "string") return chain.feeToken

    switch (token.type) {
      case "evm-uniswapv2":
      case "evm-erc20":
      case "evm-native":
        return evmNetwork?.nativeToken?.id
      case "substrate-assets":
      case "substrate-equilibrium":
      case "substrate-foreignassets":
      case "substrate-native":
      case "substrate-psp22":
      case "substrate-tokens":
        return chain?.nativeToken?.id
    }
  }, [chain?.feeToken, chain?.nativeToken?.id, evmNetwork?.nativeToken?.id, token])

  return useToken(feeTokenId)
}
