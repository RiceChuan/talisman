import { yupResolver } from "@hookform/resolvers/yup"
import { FormField } from "@talisman/components/Field/FormField"
import { ModalDialog } from "@talisman/components/ModalDialog"
import { SimpleButton } from "@talisman/components/SimpleButton"
import { api } from "@ui/api"
import { useCallback } from "react"
import { useForm } from "react-hook-form"
import styled from "styled-components"
import { useMigratePassword } from "./context"
import * as yup from "yup"

const FullWidthButton = styled(SimpleButton)`
  width: 100%;
`
type FormData = {
  password: string
}

const schema = yup
  .object({
    password: yup.string().required(""),
  })
  .required()

export const EnterPasswordForm = () => {
  const { setPassword, setMnemonic } = useMigratePassword()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: yupResolver(schema),
  })

  const submit = useCallback(
    async ({ password }: FormData) => {
      try {
        // use mnemonicUnlock message because authenticate causes logout on failure
        const mnemonic = await api.mnemonicUnlock(password)
        if (mnemonic) {
          setPassword(password)
          setMnemonic(mnemonic)
        } else throw new Error("Incorrect password")
      } catch (err) {
        setError("password", {
          message: (err as Error)?.message ?? "",
        })
      }
    },
    [setPassword, setMnemonic, setError]
  )

  return (
    <ModalDialog title="Update your password">
      <p className="text-body-secondary mb-10 text-sm">
        We have upgraded our security measures, including an updated password policy and advanced
        password encryption.{" "}
        <a
          href="https://medium.com/we-are-talisman/talismans-security-model-1e60391694c0"
          target="_blank"
          rel="noreferrer"
          className="text-white opacity-100"
        >
          Learn more
        </a>{" "}
        about our new security features.
      </p>
      <p className="text-body-secondary text-sm">Enter your current password to continue</p>
      <form onSubmit={handleSubmit(submit)}>
        <FormField error={errors.password} className="mb-4">
          <input
            {...register("password")}
            type="password"
            placeholder="Enter your password"
            spellCheck={false}
            autoComplete="off"
            data-lpignore
            autoFocus
          />
        </FormField>
        <FullWidthButton
          className="mt-12"
          type="submit"
          primary
          disabled={!isValid}
          processing={isSubmitting}
        >
          Continue
        </FullWidthButton>
      </form>
    </ModalDialog>
  )
}
