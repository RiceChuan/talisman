type Pagination = {
  current_page: number
  per_page: number
  total_items: number
  total_pages: number
  next_page: number | null
  prev_page: number | null
}

// Key Type
type Key = {
  ss58: string
  hex: string
}

// Subnet Dominance Type
type SubnetDominance = {
  netuid: number
  dominance: string
  family_stake: string
}

// Validator Data Type
type ValidatorData = {
  hotkey: Key
  coldkey: Key
  name: string
  block_number: number
  timestamp: string // ISO date format string
  rank: number
  nominators: number
  nominators_24_hr_change: number
  system_stake: string
  stake: string
  stake_24_hr_change: string
  dominance: string
  validator_stake: string
  take: string
  total_daily_return: string
  validator_return: string
  nominator_return_per_k: string
  apr: string
  nominator_return_per_k_7_day_average: string
  nominator_return_per_k_30_day_average: string
  apr_7_day_average: string
  apr_30_day_average: string
  pending_emission: string
  blocks_until_next_reward: number
  last_reward_block: number
  registrations: number[]
  permits: number[]
  subnet_dominance: SubnetDominance[]
}

export type ValidatorsData = {
  pagination: Pagination
  data: ValidatorData[]
}

export type Validator = {
  name: string
  url: string
  description: string
  signature: string
}

export type ValidatorsResponse = {
  [key: string]: Validator // The key is the unique validator hotkey.
}

export type BondOption = {
  poolId: number | string
  name: string
  apr: number
  totalStaked: number
  totalStakers: number
  hasData: boolean
  isError: boolean
  isRecommended?: boolean
}

type Address = {
  ss58: string
  hex: string
}

type DelegateData = {
  nominator: Address
  delegate: Address
  block_number: number
  timestamp: string // ISO date string
  balance: string // Big number represented as a string
  delegate_from: number
  delegate_from_timestamp: string // ISO date string
}

export type DelegatesData = {
  pagination: Pagination
  data: DelegateData[]
}
