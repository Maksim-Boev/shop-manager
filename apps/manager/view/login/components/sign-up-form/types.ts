import type { TPlan } from '../../types'

export type { TPlan }

export interface ISignUpStep1 {
  name: string
  company: string
  email: string
  plan: TPlan
}

export interface ISignUpStep1Errors {
  name?: string
  company?: string
  email?: string
}
