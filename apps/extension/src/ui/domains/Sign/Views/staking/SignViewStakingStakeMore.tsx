import { TokenId } from "@talismn/chaindata-provider"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { TokenLogo } from "@ui/domains/Asset/TokenLogo"
import { TokensAndFiat } from "@ui/domains/Asset/TokensAndFiat"

export const SignViewStakingStakeMore: FC<{
  planck: bigint
  tokenId: TokenId
}> = ({ planck, tokenId }) => {
  const { t } = useTranslation("request")
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div>{t("You are adding")}</div>
      <div className="text-body flex items-center gap-2">
        <TokenLogo tokenId={tokenId} className="inline h-[1em] w-[1em]" />{" "}
        <TokensAndFiat planck={planck} tokenId={tokenId} noCountUp />
      </div>
      <div>{t("to your staked balance")}</div>
    </div>
  )
}
