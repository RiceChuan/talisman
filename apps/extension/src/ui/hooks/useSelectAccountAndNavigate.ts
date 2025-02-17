import { isAddressEqual } from "@talismn/util"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAccounts } from "@ui/state"

export const useSelectAccountAndNavigate = (url: string) => {
  const navigate = useNavigate()
  const accounts = useAccounts()

  const [address, setAddress] = useState<string>()

  useEffect(() => {
    if (!address) return

    const targetUrl = `${url}?${new URLSearchParams({ account: address })}`

    let timeout: ReturnType<typeof setTimeout> | null

    // redirect if account exists
    if (accounts.some((a) => isAddressEqual(a.address, address))) {
      navigate(targetUrl)
    } else {
      // if account still doesnt exist after 1 second, redirect anyway
      timeout = setTimeout(() => {
        navigate(targetUrl)
      }, 1000)
    }

    return () => {
      if (timeout !== null) clearTimeout(timeout)
    }
  }, [accounts, address, navigate, url])

  return { setAddress }
}
