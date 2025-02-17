import { ChainId, EvmNetworkId } from "@talismn/chaindata-provider"
import { classNames } from "@talismn/util"
import { FC, Suspense, useCallback, useEffect, useId, useMemo, useState } from "react"

import { IS_FIREFOX, UNKNOWN_NETWORK_URL } from "@extension/shared"
import { useChain, useEvmNetwork } from "@ui/state"

type ChainLogoBaseProps = {
  id?: ChainId | EvmNetworkId
  name?: string
  logo?: string | null
  iconUrls?: string[]
  className?: string
}

const getLogoUrl = (logo: string | null | undefined) => {
  // if (logo)
  //   return logo.replace("https://raw.githubusercontent.com/", "https://cdn.statically.io/gh/")
  return logo ?? UNKNOWN_NETWORK_URL
}

export const ChainLogoBase: FC<ChainLogoBaseProps> = ({ id, logo, className }) => {
  const staticId = useId()
  const [src, setSrc] = useState(() => getLogoUrl(logo))

  // reset
  useEffect(() => {
    const newVal = getLogoUrl(logo)
    if (newVal !== src) setSrc(newVal)
  }, [logo, src])

  const handleError = useCallback(() => setSrc(UNKNOWN_NETWORK_URL), [])

  const imgClassName = useMemo(
    () => classNames("relative block w-[1em] shrink-0 aspect-square", className),
    [className],
  )

  // use url as key to reset dom element in case url changes, otherwise onError can't fire again
  return (
    <img
      key={`${staticId}::${logo ?? id ?? "EMPTY"}`}
      data-id={id}
      src={src}
      className={imgClassName}
      alt=""
      crossOrigin={IS_FIREFOX ? undefined : "anonymous"}
      loading="lazy" // defers download, helps performance especially in chain lists
      onError={handleError}
    />
  )
}

type ChainLogoProps = {
  className?: string
  id?: ChainId | EvmNetworkId
}

const ChainLogoInner: FC<ChainLogoProps> = ({ id, className }) => {
  const chain = useChain(id)
  const evmNetwork = useEvmNetwork(id)
  const evmNetworkSubstrateChain = useChain(evmNetwork?.substrateChain?.id)

  const props: ChainLogoBaseProps = useMemo(
    () => chain ?? evmNetworkSubstrateChain ?? evmNetwork ?? {},
    [chain, evmNetwork, evmNetworkSubstrateChain],
  )

  return <ChainLogoBase {...props} className={className} />
}

const ChainLogoFallback: FC<{ className?: string }> = ({ className }) => (
  <div
    className={classNames(
      "!bg-body-disabled !block h-[1em] w-[1em] shrink-0 overflow-hidden rounded-full",
      className,
    )}
  ></div>
)

export const ChainLogo: FC<ChainLogoProps> = (props) => (
  <Suspense fallback={<ChainLogoFallback className={props.className} />}>
    <ChainLogoInner {...props} />
  </Suspense>
)
