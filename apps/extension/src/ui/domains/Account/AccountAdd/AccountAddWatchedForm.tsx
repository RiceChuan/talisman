import { yupResolver } from "@hookform/resolvers/yup"
import { ArrowRightIcon } from "@talismn/icons"
import { classNames, sleep } from "@talismn/util"
import { getAddressType } from "extension-shared"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button, FormFieldContainer, FormFieldInputText, Toggle } from "talisman-ui"
import * as yup from "yup"

import { UiAccountAddressType } from "@extension/core"
import { notify, notifyUpdate } from "@talisman/components/Notifications"
import { api } from "@ui/api"
import { AccountAddPageProps } from "@ui/domains/Account/AccountAdd/types"
import { AccountTypeSelector } from "@ui/domains/Account/AccountTypeSelector"
import { AddressFieldNsBadge } from "@ui/domains/Account/AddressFieldNsBadge"
import { useResolveNsName } from "@ui/hooks/useResolveNsName"
import { useAccounts } from "@ui/state"

export const AccountAddWatchedForm = ({ onSuccess }: AccountAddPageProps) => {
  const { t } = useTranslation("admin")
  const allAccounts = useAccounts()
  const accountNames = useMemo(() => allAccounts.map((a) => a.name), [allAccounts])

  const schema = useMemo(
    () =>
      yup
        .object({
          name: yup.string().required(" ").notOneOf(accountNames, t("Name already in use")),
          searchAddress: yup.string().trim().required(" "),
          type: yup.mixed<UiAccountAddressType>().oneOf(["ethereum", "sr25519"]).defined(),
          address: yup.string().trim().required(" "),
          isPortfolio: yup.boolean().defined(),
        })
        .test("is-valid-address", t("Invalid address"), (val, ctx) => {
          const { type, address } = val

          if (type === "sr25519" && getAddressType(address) !== "ss58")
            return ctx.createError({
              path: "address",
              message: t("Invalid address"),
            })

          if (type === "ethereum" && getAddressType(address) !== "ethereum")
            return ctx.createError({
              path: "address",
              message: t("Invalid address"),
            })

          return true
        })
        .required(),

    [accountNames, t],
  )

  type FormData = yup.InferType<typeof schema>

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    watch,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: yupResolver(schema),
  })

  const { type, searchAddress } = watch()
  const [nsLookup, { nsLookupType, isNsLookup, isNsFetching }] = useResolveNsName(searchAddress)

  useEffect(() => {
    if (!isNsLookup) {
      setValue("address", searchAddress, { shouldValidate: true })
      return
    }

    if (isNsFetching) {
      // while querying NS service the address should be empty so form is invalid without displaying an error
      setValue("address", "", { shouldValidate: true })
    } else
      setValue("address", nsLookup ?? (nsLookup === null ? "invalid" : ""), {
        shouldValidate: true,
      })
  }, [nsLookup, isNsLookup, searchAddress, setValue, isNsFetching])

  const submit = useCallback(
    async ({ name, address, isPortfolio }: FormData) => {
      const notificationId = notify(
        {
          type: "processing",
          title: t("Adding account"),
          subtitle: t("Please wait"),
        },
        { autoClose: false },
      )

      // pause to prevent double notification
      await sleep(1000)

      try {
        onSuccess(await api.accountCreateWatched(name, address, isPortfolio))

        notifyUpdate(notificationId, {
          type: "success",
          title: t("Account added"),
          subtitle: name,
        })
      } catch (err) {
        notifyUpdate(notificationId, {
          type: "error",
          title: t("Error creating account"),
          subtitle: (err as Error)?.message,
        })
      }
    },
    [onSuccess, t],
  )

  const handleTypeChange = useCallback(
    (type: UiAccountAddressType) => {
      setValue("type", type, { shouldValidate: true })
      trigger()
    },
    [setValue, trigger],
  )

  const hasSetFocus = useRef(false)
  useEffect(() => {
    if (type && !hasSetFocus.current) {
      setFocus("name")
      hasSetFocus.current = true
    }
  }, [setFocus, type])

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="mb-12 flex flex-col gap-8">
        <AccountTypeSelector onChange={handleTypeChange} />
        <div className={classNames("transition-opacity", type ? "opacity-100" : "opacity-0")}>
          <div>
            <p className="text-body-secondary">
              {t("Please enter the name and the wallet address you'll be watching.")}
            </p>
            <p className="text-body-disabled text-xs">
              {t(
                "Note that the address will be watch-only and will not be able to sign transactions.",
              )}
            </p>
          </div>
          <div>
            <FormFieldContainer error={errors.name?.message}>
              <FormFieldInputText
                {...register("name")}
                placeholder={t("Choose a name")}
                spellCheck={false}
                autoComplete="off"
                data-lpignore
              />
            </FormFieldContainer>
            <FormFieldContainer error={errors.address?.message}>
              <FormFieldInputText
                {...register("searchAddress")}
                placeholder={t("Enter wallet address")}
                spellCheck={false}
                autoComplete="off"
                data-lpignore
                after={
                  <AddressFieldNsBadge
                    nsLookup={nsLookup}
                    nsLookupType={nsLookupType}
                    isNsLookup={isNsLookup}
                    isNsFetching={isNsFetching}
                  />
                }
              />
            </FormFieldContainer>
            <div className="bg-grey-850 mt-4 flex h-[58px] w-full items-center rounded px-12">
              <div className="grow space-y-4">
                <div className="text-body leading-none">{t("Include in my portfolio")}</div>
                <div className="text-body-disabled text-sm leading-none">
                  {t(
                    "If toggled on, this account's balances will be included in your Total Portfolio",
                  )}
                </div>
              </div>
              <Toggle {...register("isPortfolio")} />
            </div>
          </div>
        </div>
        <div className="flex w-full justify-end">
          <Button
            icon={ArrowRightIcon}
            type="submit"
            primary
            disabled={!isValid}
            processing={isSubmitting}
          >
            {t("Add")}
          </Button>
        </div>
      </div>
    </form>
  )
}
