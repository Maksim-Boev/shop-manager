import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { verifyCredentials } from '../../lib/auth'
import { createTestCompany, createTestUser } from '../helpers'

describe('verifyCredentials', () => {
  const PASSWORD = 'testpass123'

  it('возвращает AuthUser при верных credentials', async () => {
    const hash = await bcrypt.hash(PASSWORD, 10)
    const company = await createTestCompany()
    const user = await createTestUser(company.id, { role: 'ADMIN', passwordHash: hash })

    const result = await verifyCredentials(user.email, PASSWORD)

    expect(result).not.toBeNull()
    expect(result?.id).toBe(user.id)
    expect(result?.companyId).toBe(company.id)
    expect(result?.role).toBe('ADMIN')
    expect(result?.firstName).toBe('Test')
    expect(result?.lastName).toBe('User')
  })

  it('возвращает null при неверном пароле', async () => {
    const hash = await bcrypt.hash(PASSWORD, 10)
    const company = await createTestCompany()
    const user = await createTestUser(company.id, { passwordHash: hash })

    const result = await verifyCredentials(user.email, 'wrong-password')

    expect(result).toBeNull()
  })

  it('возвращает null при несуществующем email', async () => {
    const result = await verifyCredentials('nobody@nowhere.example', PASSWORD)

    expect(result).toBeNull()
  })

  it('возвращает null для заблокированного пользователя', async () => {
    const hash = await bcrypt.hash(PASSWORD, 10)
    const company = await createTestCompany()
    const user = await createTestUser(company.id, { passwordHash: hash })
    await prisma.user.update({ where: { id: user.id }, data: { status: 'BLOCKED' } })

    const result = await verifyCredentials(user.email, PASSWORD)

    expect(result).toBeNull()
  })
})
