import { FC, PropsWithChildren, ReactNode, Suspense, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "talisman-ui"

import { SuspenseTracker } from "@talisman/components/SuspenseTracker"
import { DashboardPortfolioHeader } from "@ui/domains/Portfolio/DashboardPortfolioHeader"
import { GetStarted } from "@ui/domains/Portfolio/GetStarted/GetStarted"
import { PortfolioTabs } from "@ui/domains/Portfolio/PortfolioTabs"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { usePortfolio } from "@ui/state"

const EnableNetworkMessage: FC<{ type?: "substrate" | "evm" }> = ({ type }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const handleClick = useCallback(() => {
    if (type === "substrate") navigate("/settings/networks-tokens/networks/polkadot")
    else if (type === "evm") navigate("/settings/networks-tokens/networks/ethereum")
    else navigate("/settings/networks-tokens/networks")
  }, [navigate, type])

  return (
    <div className="text-body-secondary mt-72 flex flex-col items-center justify-center gap-8 text-center">
      <div>{t("Enable some networks to display your assets")}</div>
      <div>
        <Button onClick={handleClick} primary small type="button">
          {t("Manage Networks")}
        </Button>
      </div>
    </div>
  )
}

const PortfolioAccountCheck: FC<PropsWithChildren> = ({ children }) => {
  const { evmNetworks, chains, accountType } = usePortfolio()
  const { selectedAccounts } = usePortfolioNavigation()

  if (!selectedAccounts.length) return <GetStarted />

  if (!accountType && !evmNetworks.length && !chains.length) return <EnableNetworkMessage />
  if (accountType === "sr25519" && !chains.length) return <EnableNetworkMessage type="substrate" />
  if (
    accountType === "ethereum" &&
    !evmNetworks.length &&
    !chains.filter((c) => c.account === "secp256k1").length
  )
    return <EnableNetworkMessage type="evm" />

  return <>{children}</>
}

export const PortfolioLayout: FC<PropsWithChildren & { toolbar?: ReactNode }> = ({
  toolbar,
  children,
}) => {
  return (
    <div className="relative flex w-full flex-col gap-6 pb-12">
      <Suspense
        fallback={<SuspenseTracker name="DashboardPortfolioLayout.PortfolioAccountCheck" />}
      >
        <DashboardPortfolioHeader />
        <PortfolioAccountCheck>
          <div className="flex h-16 w-full items-center justify-between gap-8 overflow-hidden">
            <PortfolioTabs className="text-md my-0 h-14 w-auto font-bold" />
            <div className="shrink-0">
              <Suspense fallback={<SuspenseTracker name="DashboardPortfolioLayout.Toolbar" />}>
                {toolbar}
              </Suspense>
            </div>
          </div>
          <Suspense fallback={<SuspenseTracker name="DashboardPortfolioLayout.TabContent" />}>
            {children}
          </Suspense>
        </PortfolioAccountCheck>
      </Suspense>
    </div>
  )
}
