import { API_KEY_ONFINALITY } from "@core/constants"
import { featuresStore } from "@core/domains/app/store.features"
import { chaindataProvider } from "@core/rpcs/chaindata"
import { ChainConnectorEvm } from "@talismn/chain-connector-evm"

export const chainConnectorEvm = new ChainConnectorEvm(chaindataProvider)

featuresStore.observable.subscribe((store) => {
  chainConnectorEvm.setOnfinalityApiKey(
    store.features.includes("USE_ONFINALITY_API_KEY_EVM") ? API_KEY_ONFINALITY : undefined
  )
})
