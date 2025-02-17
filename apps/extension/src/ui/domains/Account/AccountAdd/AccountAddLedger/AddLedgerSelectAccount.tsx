import { yupResolver } from "@hookform/resolvers/yup"
import { sleep } from "@talismn/util"
import { FC, useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Navigate } from "react-router-dom"
import { Button, Dropdown } from "talisman-ui"
import * as yup from "yup"

import { LedgerEthDerivationPathType } from "@extension/core"
import { notify, notifyUpdate } from "@talisman/components/Notifications"
import { LedgerEthereumAccountPicker } from "@ui/domains/Account/LedgerEthereumAccountPicker"
import { LedgerSubstrateLegacyAccountPicker } from "@ui/domains/Account/LedgerSubstrateLegacyAccountPicker"
import { CHAIN_ID_TO_LEDGER_APP_NAME } from "@ui/hooks/ledger/common"
import { useLedgerSubstrateAppByName } from "@ui/hooks/ledger/useLedgerSubstrateApp"

import { LedgerSubstrateGenericAccountPicker } from "../../LedgerSubstrateGenericAccountPicker"
import { AddSubstrateLedgerAppType, LedgerAccountDef, useAddLedgerAccount } from "./context"

const options: Record<LedgerEthDerivationPathType, string> = {
  LedgerLive: "Ledger Live",
  Legacy: "Legacy (MEW, MyCrypto)",
  BIP44: "BIP44 Standard (MetaMask, Trezor)",
}

type Option = { key: LedgerEthDerivationPathType; label: string }

const items = Object.entries(options).map<Option>(([key, value]) => ({
  key: key as LedgerEthDerivationPathType,
  label: value,
}))

type LedgerDerivationPathSelectorProps = {
  derivationPathType: LedgerEthDerivationPathType
  onChange: (value: LedgerEthDerivationPathType) => void
}

const LedgerDerivationPathSelector: FC<LedgerDerivationPathSelectorProps> = ({
  derivationPathType = "LedgerLive",
  onChange,
}) => {
  const value = useMemo(() => items.find((i) => i.key === derivationPathType), [derivationPathType])

  const handleChange = useCallback(
    (item: Option | null) => {
      if (item) onChange(item.key)
    },
    [onChange],
  )

  return (
    <Dropdown
      items={items}
      value={value}
      propertyKey="key"
      propertyLabel="label"
      onChange={handleChange}
    />
  )
}

type FormData = {
  accounts: LedgerAccountDef[]
}

export const AddLedgerSelectAccount = () => {
  const { t } = useTranslation("admin")
  const { data, connectAccounts: importAccounts, onSuccess } = useAddLedgerAccount()

  const app = useLedgerSubstrateAppByName(CHAIN_ID_TO_LEDGER_APP_NAME[data.chainId as string])

  const schema = useMemo(
    () =>
      yup
        .object({
          accounts: yup.array().of(yup.mixed<LedgerAccountDef>().defined()).min(1).defined(),
        })
        .required(),
    [],
  )

  const {
    handleSubmit,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: data,
    resolver: yupResolver(schema),
  })

  const submit = useCallback(
    async ({ accounts }: FormData) => {
      const notificationId = notify(
        {
          type: "processing",
          title: t("Connecting account", { count: accounts.length }),
          subtitle: t("Please wait"),
        },
        { autoClose: false },
      )

      // pause to prevent double notification
      await sleep(1000)

      try {
        const addresses = await importAccounts(accounts)
        notifyUpdate(notificationId, {
          type: "success",
          title: t("Account connected", { count: accounts.length }),
          subtitle: null,
        })
        onSuccess(addresses[0])
      } catch (err) {
        notifyUpdate(notificationId, {
          type: "error",
          title: t("Connecting account", { count: accounts.length }),
          subtitle: (err as Error).message,
        })
      }
    },
    [importAccounts, onSuccess, t],
  )

  const handleAccountsChange = useCallback(
    (accounts: LedgerAccountDef[]) => {
      setValue("accounts", accounts, { shouldValidate: true })
    },
    [setValue],
  )

  const [derivationPathType, setDerivationPathType] =
    useState<LedgerEthDerivationPathType>("LedgerLive")

  const isInvalidInputs = useMemo(() => {
    if (!data.type) return true
    if (data.type === "sr25519" && !data.substrateAppType) return true
    if (
      data.type === "sr25519" &&
      data.substrateAppType === AddSubstrateLedgerAppType.Legacy &&
      !data.chainId
    )
      return true
    return false
  }, [data.chainId, data.substrateAppType, data.type])

  if (isInvalidInputs) return <Navigate to="/accounts/add/ledger" replace />

  return (
    <form className="flex max-h-screen flex-col gap-12" onSubmit={handleSubmit(submit)}>
      <div className="flex-grow">
        <h1 className="m-0">{t("Connect Ledger")}</h1>
        {data.type === "ethereum" && (
          <>
            <p className="text-body-secondary mb-12 mt-[1em]">
              {t(
                "The derivation path will be different based on which application you used to initialise your Ledger account.",
              )}
            </p>
            <div>
              <LedgerDerivationPathSelector
                derivationPathType={derivationPathType}
                onChange={setDerivationPathType}
              />
            </div>
            <div className="h-4" />
          </>
        )}
        <p className="text-body-secondary mb-12 mt-[1em]">
          {t("Please select which account(s) you'd like to connect.")}
          {data.type === "ethereum" && (
            <>
              <br />
              {t(
                "Amounts displayed for each account only include the most popular tokens on major networks.",
              )}
            </>
          )}
        </p>
        {data.type === "sr25519" && (
          <>
            {data.substrateAppType === AddSubstrateLedgerAppType.Legacy && (
              <LedgerSubstrateLegacyAccountPicker
                chainId={data.chainId as string}
                onChange={handleAccountsChange}
              />
            )}
            {data.substrateAppType === AddSubstrateLedgerAppType.Generic && (
              <LedgerSubstrateGenericAccountPicker onChange={handleAccountsChange} />
            )}
            {data.substrateAppType === AddSubstrateLedgerAppType.Migration && !!app && (
              <LedgerSubstrateGenericAccountPicker onChange={handleAccountsChange} app={app} />
            )}
          </>
        )}
        {data.type === "ethereum" && (
          <LedgerEthereumAccountPicker
            name={t("Ledger Ethereum")}
            derivationPathType={derivationPathType}
            onChange={handleAccountsChange}
          />
        )}
      </div>
      <div className="flex justify-end">
        <Button
          className="w-[24rem]"
          type="submit"
          primary
          disabled={!isValid}
          processing={isSubmitting}
        >
          {t("Continue")}
        </Button>
      </div>
    </form>
  )
}
