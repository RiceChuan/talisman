import { AccountJsonHardwareSubstrate } from "@core/domains/accounts/types"
import { AddressBookContact } from "@core/domains/app/store.addressBook"
import { AccountJson } from "@polkadot/extension-base/background/types"
import Field from "@talisman/components/Field/Field"
import { ReactComponent as EnterIcon } from "@talisman/theme/icons/corner-down-left.svg"
import { scrollbarsStyle } from "@talisman/theme/styles"
import { classNames } from "@talisman/util/classNames"
import { convertAddress } from "@talisman/util/convertAddress"
import { AccountAddressType, getAddressType } from "@talisman/util/getAddressType"
import { isValidAddress } from "@talisman/util/isValidAddress"
import Avatar from "@ui/domains/Account/Avatar"
import AccountName from "@ui/domains/Account/AccountName"
import useAccounts from "@ui/hooks/useAccounts"
import { useAddressBook } from "@ui/hooks/useAddressBook"
import Downshift from "downshift"
import {
  ChangeEventHandler,
  DetailedHTMLProps,
  FC,
  KeyboardEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import styled from "styled-components"

import { Address } from "./Address"
import NamedAddress from "./NamedAddress"

const Container = styled.div<{ withAddressInput?: boolean }>`
  display: flex;
  margin-left: 1.2rem;
  overflow: hidden;

  .accounts-dropdown {
    font-size: var(--font-size-normal);
    z-index: 1;
    display: block;
    background: var(--color-background);
    border: 1px solid var(--color-background-muted);
    border-radius: var(--border-radius);
    position: absolute;
    top: 2.4em;
    opacity: 0;
    transition: opacity var(--transition-speed) ease-in-out;

    max-height: ${(props) => (props.withAddressInput ? "20em" : "14em")};
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .accounts-group {
      flex-grow: 1;
      overflow: hidden;
      overflow-y: auto;

      ${scrollbarsStyle()}

      ul {
        margin: 0;
        padding: 0;
        max-width: 28rem;
        display: flex;
        flex-direction: column;
        border-radius: 0 0 var(--border-radius) var(--border-radius);

        .account-avatar {
          font-size: 2.4rem;
        }

        .account-name {
          margin: 0;
          font-size: var(--font-size-small);
        }

        .link {
          padding-left: 0;
          padding-right: 0;
        }
      }
      ul li {
        padding: 0.8rem 1.6rem;
        list-style: none;
        cursor: pointer;
      }
      ul li[aria-selected="true"] {
        background: var(--color-background-muted-3x);
      }
    }
  }
  .accounts-dropdown.mounted {
    opacity: 1;
  }

  button {
    padding: 0;
    .name {
      line-height: inherit;
    }
  }

  .group-header {
    margin: 1.6rem;
    color: var(--color-mid);
  }

  .paste-address-container {
    margin: 1rem;
    margin-bottom: 1.4rem;
    width: 26rem;

    svg {
      color: var(--color-background-muted-2x);
      cursor: pointer;
      pointer-events: auto;
    }
    svg:hover {
      color: var(--color-dim);
    }
  }

  .paste-address {
    background: transparent;
    border: none;
    outline: none;
    display: inline-block;
    color: var(--color-mid);
    min-width: 0;
    flex-grow: 1;
  }
`

const Button = styled.button<{ hasValue: boolean }>`
  max-width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--font-size-xlarge);
  line-height: 1.6em;
  color: ${({ hasValue }) => (hasValue ? "var(--color-dim)" : "var(--color-background-muted-2x)")};
  cursor: pointer;
  overflow: hidden;

  .name.name {
    font-size: inherit;
    line-height: inherit;
  }
  .custom-address > span {
    color: var(--color-mid);
  }
  .custom-address > .address {
    font-size: var(--font-size-normal);
  }

  &:hover,
  &:hover .account-name .name,
  &:hover .custom-address > span {
    color: var(--color-foreground-muted-2x);
  }
`

const FormattedAddress = ({ address, placeholder = "who?" }: any) => {
  const accounts = useAccounts()
  const { contacts } = useAddressBook()

  const localAccount = useMemo(
    () =>
      accounts.filter(
        (account) =>
          address && convertAddress(account.address, null) === convertAddress(address, null)
      )[0],
    [accounts, address]
  )

  const contactAddress = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          address && convertAddress(contact.address, null) === convertAddress(address, null)
      )[0],
    [contacts, address]
  )

  if (localAccount) return <AccountName withAvatar address={localAccount?.address} />
  if (contactAddress)
    return <NamedAddress withAvatar address={contactAddress.address} name={contactAddress.name} />

  return address ? (
    <span className="gap custom-address flex">
      <Avatar address={address} />
      <Address className="address" address={address} />
    </span>
  ) : (
    placeholder
  )
}

type PasteAddressProps = {
  onSelected: (address: string) => void
  className?: string
  exclude?: string
  addressType?: AccountAddressType
  inputProps?: DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
}

const PasteAddress = ({ onSelected, exclude, addressType, inputProps = {} }: PasteAddressProps) => {
  const [pastedAddress, setPastedAddress] = useState<string>()
  const [isInvalid, setIsInvalid] = useState<boolean>(false)
  const [isExcluded, setIsExcluded] = useState<boolean>(false)

  const onSelectedAddress = useCallback(() => {
    if (!pastedAddress) return

    if (!isValidAddress(pastedAddress)) setIsInvalid(true)
    else if (addressType && addressType !== getAddressType(pastedAddress)) setIsInvalid(true)
    else if (exclude && convertAddress(exclude, null) === convertAddress(pastedAddress, null))
      setIsExcluded(true)
    else if (onSelected) {
      setIsInvalid(false)
      onSelected(pastedAddress)
      setPastedAddress(undefined)
    }
  }, [addressType, exclude, onSelected, pastedAddress])

  useEffect(() => {
    setIsInvalid(false)
  }, [pastedAddress])

  const { status, message } = useMemo(
    () => ({
      status: isInvalid || isExcluded ? "ERROR" : undefined,
      message: isInvalid ? "Invalid address" : isExcluded ? "Cannot send to self" : undefined,
    }),
    [isExcluded, isInvalid]
  )

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setPastedAddress(e.target.value)
  }, [])

  const handleKeyUp: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === "Enter") {
        onSelectedAddress()
        e.preventDefault()
      }
    },
    [onSelectedAddress]
  )

  // select automatically if address is valid
  useEffect(() => {
    if (pastedAddress && isValidAddress(pastedAddress)) onSelectedAddress()
  }, [onSelected, onSelectedAddress, pastedAddress])

  return (
    <Field
      status={status}
      message={message}
      className="paste-address-container"
      suffix={pastedAddress && <EnterIcon onClick={onSelectedAddress} />}
    >
      <input
        spellCheck={false}
        autoComplete="off"
        data-lpignore
        onChange={handleChange}
        type="text"
        className="paste-address"
        placeholder="Paste address"
        onKeyPress={handleKeyUp}
      />
    </Field>
  )
}

// prevents searchbox to be filled with item.toString() when we select one
// we want to keep this an empty string to allow for a quick search without clearing the field
const handleItemToString = (item: AccountJson | null) => ""

type DivWithMountProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

// Purpose of this custom <div> component is just to have a .mounted class right after it's mounted, to use a CSS transition
// Downshift uses the ref, need to forward it
const DivWithMount = forwardRef<HTMLDivElement, DivWithMountProps>(
  ({ children, className, ...props }: DivWithMountProps, ref) => {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => setIsMounted(true), [])
    return (
      <div ref={ref} className={classNames(className, isMounted && "mounted")} {...props}>
        {children}
      </div>
    )
  }
)

type Props = {
  defaultValue?: string
  exclude?: string
  onChange: (address: string) => void
  placeholder?: string
  className?: string
  withAddressInput?: boolean
  withContacts?: boolean
  label?: string
  tabIndex?: number
  addressType?: AccountAddressType
  genesisHash?: string | null
}

const AccountPicker: FC<Props> = ({
  defaultValue,
  exclude,
  onChange,
  placeholder,
  className,
  withContacts,
  withAddressInput,
  label = "My Accounts",
  tabIndex,
  addressType,
  genesisHash,
}: any) => {
  const accounts = useAccounts()
  const { contacts } = useAddressBook()
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(defaultValue)

  useEffect(() => {
    if (onChange) onChange(selectedAddress)
  }, [onChange, selectedAddress])

  useEffect(() => {
    setSelectedAddress((prev) => {
      return prev === exclude ? undefined : prev
    })
  }, [exclude])

  const filteredAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account?.address !== exclude)
        .filter((account) => !addressType || addressType === getAddressType(account.address))
        .filter(
          (acc) =>
            !acc.isHardware || (acc as AccountJsonHardwareSubstrate).genesisHash === genesisHash
        ),
    [accounts, addressType, exclude, genesisHash]
  )

  const filteredContacts = useMemo(
    () =>
      withContacts
        ? contacts
            .filter((contact) => contact?.address !== exclude)
            .filter((contact) => !addressType || addressType === getAddressType(contact.address))
        : [],
    [contacts, withContacts, addressType, exclude]
  )

  useEffect(() => {
    //if selected address is a hardware account and is not in the list, clear
    if (
      accounts.some(
        (a) =>
          a.isHardware &&
          a.address === selectedAddress &&
          genesisHash &&
          (a as AccountJsonHardwareSubstrate).genesisHash !== genesisHash
      )
    )
      setSelectedAddress(undefined)
  }, [accounts, genesisHash, selectedAddress])

  const handleChange = useCallback((item: AccountJson | AddressBookContact | null) => {
    setSelectedAddress(item?.address as string)
  }, [])

  const handlePasteAddress = useCallback(
    (cb: () => void) => (address: string) => {
      setSelectedAddress(address)
      cb()
    },
    []
  )

  // clear if not compatible with token type
  useEffect(() => {
    if (
      addressType !== "UNKNOWN" &&
      selectedAddress &&
      getAddressType(selectedAddress) !== addressType
    )
      setSelectedAddress(undefined)
  }, [addressType, selectedAddress])

  return (
    <Downshift
      key={`${addressType}-${genesisHash}`} // otherwise downshift may will trigger onChange after items changed and user selects again
      onChange={handleChange}
      itemToString={handleItemToString}
    >
      {({ getItemProps, isOpen, getToggleButtonProps, getMenuProps, getRootProps, closeMenu }) => {
        return (
          <Container withAddressInput={withAddressInput} className={className} {...getRootProps()}>
            <Button
              hasValue={Boolean(selectedAddress)}
              tabIndex={tabIndex}
              {...getToggleButtonProps()}
            >
              <FormattedAddress address={selectedAddress} placeholder={placeholder} />
            </Button>
            {isOpen && (
              <DivWithMount className="accounts-dropdown" {...getMenuProps()}>
                {withAddressInput && (
                  <PasteAddress
                    onSelected={handlePasteAddress(closeMenu)}
                    exclude={exclude}
                    addressType={addressType}
                  />
                )}
                <div className="accounts-group">
                  {filteredContacts.length > 0 && (
                    <>
                      {withAddressInput && <span className="group-header">Contacts</span>}
                      <ul>
                        {filteredContacts.map((contact, index) => (
                          <li
                            {...getItemProps({
                              key: contact.address,
                              item: contact,
                              index,
                            })}
                          >
                            <NamedAddress
                              withAvatar
                              address={contact.address}
                              name={contact.name}
                            />
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {filteredAccounts.length > 0 && (
                    <>
                      {label && withAddressInput && <span className="group-header">{label}</span>}
                      <ul>
                        {filteredAccounts.map((account, index) => (
                          <li
                            {...getItemProps({
                              key: account.address,
                              item: account,
                              index: index + filteredContacts.length,
                            })}
                          >
                            <AccountName withAvatar address={account?.address} />
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </DivWithMount>
            )}
          </Container>
        )
      }}
    </Downshift>
  )
}

export default AccountPicker
