export type TAuthView = 'main' | 'forgot'
export type TAuthTab = 'signin' | 'signup'
export type TPlan = 'starter' | 'pro'

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

export interface IPlanOptionProps {
  value: TPlan
  active: boolean
  onClick: () => void
  title: string
  desc: string
  price: string
  badge?: string
  featured?: boolean
}
