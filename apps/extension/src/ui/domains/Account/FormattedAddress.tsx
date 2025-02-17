import { classNames } from "@talismn/util"
import { FC } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "talisman-ui"

import { useFormattedAddress } from "@ui/hooks/useFormattedAddress"
import { useIsKnownAddress } from "@ui/hooks/useIsKnownAddress"
import { useAccountByAddress } from "@ui/state"

import { AccountIcon } from "./AccountIcon"
import { AccountTypeIcon } from "./AccountTypeIcon"
import { Address } from "./Address"

const FormattedAddressTooltip: FC<{ address: string; genesisHash?: string | null }> = ({
  address,
  genesisHash,
}) => {
  const formattedAddress = useFormattedAddress(address, genesisHash)

  // caller may have formatted the address for a specific chain (ex substrate sign request), use formatted address only for network specific accounts
  const displayAddress = genesisHash ? formattedAddress : address

  return <TooltipContent>{displayAddress}</TooltipContent>
}

export const FormattedAddress: FC<{
  address: string
  withSource?: boolean
  noTooltip?: boolean
  className?: string
}> = ({ address, withSource, noTooltip, className }) => {
  const isKnown = useIsKnownAddress(address)
  const account = useAccountByAddress(address)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={classNames(
            "inline-flex max-w-full items-baseline gap-[0.3em] overflow-hidden",
            className,
          )}
        >
          <div>
            <AccountIcon
              address={address}
              genesisHash={account?.genesisHash}
              className="inline-block align-middle text-[1.4em]"
            />
          </div>
          <span className="max-w-full truncate">
            {isKnown && isKnown.type === "account" ? (
              <>{isKnown.value.name}</>
            ) : (
              <Address address={address} noTooltip />
            )}
          </span>
          {withSource && account && (
            <AccountTypeIcon className="text-primary" origin={account.origin} />
          )}
        </span>
      </TooltipTrigger>
      {!noTooltip && (
        <FormattedAddressTooltip address={address} genesisHash={account?.genesisHash} />
      )}
    </Tooltip>
  )
}
