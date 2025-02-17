import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { PublicClient, TransactionRequest } from "viem"

import {
  AccountType,
  EthPriorityOptionName,
  getMaxTransactionCost,
  serializeTransactionRequest,
} from "@extension/core"
import { useAccountByAddress } from "@ui/state"

import { useEthBalance } from "./useEthBalance"

export const useIsValidEthTransaction = (
  publicClient: PublicClient | undefined,
  tx: TransactionRequest | undefined,
  priority: EthPriorityOptionName | undefined,
  isReplacement = false,
) => {
  const { t } = useTranslation("request")
  const account = useAccountByAddress(tx?.from)
  const { balance } = useEthBalance(publicClient, tx?.from)

  const {
    data,
    error: liveError,
    isLoading,
  } = useQuery({
    queryKey: [
      "useIsValidEthTransaction",
      publicClient?.chain?.id,
      tx && serializeTransactionRequest(tx),
      account?.address,
      priority,
    ],
    queryFn: async () => {
      if (!publicClient || !tx || !account || balance === undefined) return null

      if (account.origin === "WATCHED")
        throw new Error(t("Cannot sign transactions with a watched account"))

      if (account.origin === AccountType.Dcent)
        throw new Error(t("Cannot sign transactions with a D'CENT account"))

      // balance checks
      const value = tx.value ?? 0n
      const maxTransactionCost = getMaxTransactionCost(tx)
      if (!balance || value > balance) throw new Error(t("Insufficient balance"))
      if (!balance || maxTransactionCost > balance)
        throw new Error(t("Insufficient balance to pay for fee"))

      // dry runs the transaction, if it fails we can't know for sure what the issue really is
      // there should be helpful message in the error though.
      const estimatedGas = await publicClient.estimateGas({
        account: tx.from,
        ...tx,
        // unless it's a replacement tx, don't provide the nonce
        // otherwise it would throw a cryptic error on moonbeam networks if previous tx is not finalized
        nonce: isReplacement ? tx.nonce : undefined,
      })
      return estimatedGas > 0n
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 0,
    placeholderData: keepPreviousData,
    enabled: !!publicClient && !!tx && !!account && balance !== undefined,
  })

  // while loading, keep returning the previous error to prevent it from blinking on screen
  const [error, setError] = useState(() => liveError)
  useEffect(() => {
    if (!isLoading) setError(liveError)
  }, [isLoading, liveError])

  return { isValid: !!data, error, isLoading }
}
