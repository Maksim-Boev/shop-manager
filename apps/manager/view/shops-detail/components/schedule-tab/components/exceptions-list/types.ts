import type { IStoreScheduleException } from '@pkg/db'

export type IExceptionRow = IStoreScheduleException

export interface IExceptionsListProps {
  shopId: string
  exceptions: IExceptionRow[]
}
