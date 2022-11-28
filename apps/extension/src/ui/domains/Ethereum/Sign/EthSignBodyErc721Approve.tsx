import { FC, useMemo } from "react"
import { EthSignBodyShimmer } from "./EthSignBodyShimmer"
import { getContractCallArg } from "./getContractCallArg"
import { SignAlertMessage, SignParamAccountButton, SignParamNetworkAddressButton } from "./shared"
import { EthSignContainer } from "./shared/EthSignContainer"
import { BigNumber } from "ethers"
import { useQuery } from "@tanstack/react-query"
import { UnsafeImage } from "talisman-ui"
import { getNftMetadata } from "@core/util/getNftMetadata"
import { useEthSignKnownTransactionRequest } from "./shared/useEthSignKnownTransactionRequest"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export const EthSignBodyErc721Approve: FC = () => {
  const { account, network, transactionInfo } = useEthSignKnownTransactionRequest()

  const qMetadata = useQuery({
    queryKey: [transactionInfo.asset?.tokenURI],
    queryFn: () => getNftMetadata(transactionInfo.asset?.tokenURI, 96, 96),
  })

  const { operator, approve, tokenId } = useMemo(() => {
    const operator = getContractCallArg(transactionInfo.contractCall, "operator")
    return {
      operator: getContractCallArg(transactionInfo.contractCall, "operator"),
      approve: operator !== ZERO_ADDRESS,
      tokenId: BigNumber.from(getContractCallArg(transactionInfo.contractCall, "tokenId")),
    }
  }, [transactionInfo.contractCall])

  const { name, image } = useMemo(
    () => ({
      name: qMetadata?.data?.name ?? `${transactionInfo?.asset?.name} #${tokenId.toString()}`,
      image: qMetadata?.data?.image,
    }),
    [qMetadata?.data?.image, qMetadata?.data?.name, tokenId, transactionInfo?.asset?.name]
  )

  if (qMetadata.isLoading || !operator || !account || !network) return <EthSignBodyShimmer />

  return (
    <EthSignContainer
      title={<>{approve ? "NFT Approval Request" : "Revoke NFT Approval Request"}</>}
      alert={
        approve ? (
          <SignAlertMessage>
            <span className="text-body-secondary">
              This contract will have permission to transfer this NFT on your behalf until manually
              revoked.
            </span>{" "}
            <a
              className="text-white"
              href="https://docs.talisman.xyz/talisman/navigating-the-paraverse/ethereum-features/token-approvals"
              target="_blank"
            >
              Learn more
            </a>
          </SignAlertMessage>
        ) : null
      }
    >
      <div className="flex">
        <div>{approve ? "Allow" : "Disallow"}</div>
        <SignParamNetworkAddressButton network={network} address={operator} />
      </div>
      <div className="flex">
        <div>to transfer</div>
        <SignParamNetworkAddressButton
          address={transactionInfo.targetAddress}
          network={network}
          name={name}
        />
      </div>
      <div className="flex max-w-full overflow-hidden">
        <div className="whitespace-nowrap">on behalf of</div>
        <SignParamAccountButton address={account.address} explorerUrl={network.explorerUrl} />
      </div>
      {!!image && (
        <div className="mt-12 mb-[-0.8rem] text-center">
          <UnsafeImage
            className="bg-grey-800 inline-block h-48 w-48 rounded"
            src={image}
            alt={name}
          />
        </div>
      )}
    </EthSignContainer>
  )
}
