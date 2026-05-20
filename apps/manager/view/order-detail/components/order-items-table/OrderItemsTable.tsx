import { PackageIcon, TagIcon } from 'lucide-react'
import type { IOrderItemsTableProps } from './types'

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'шт.', KG: 'кг', GRAM: 'г', LITER: 'л',
  MILLILITER: 'мл', METER: 'м', PACK: 'пак.',
}

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtQty = (n: number) =>
  n % 1 === 0 ? String(n) : n.toLocaleString('uk-UA', { maximumFractionDigits: 3 })

const OrderItemsTable = ({
  items, subtotal, discountTotal, taxTotal, grandTotal, pointsRedeemed, pointsEarned,
}: IOrderItemsTableProps) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div>
        <h2 className="font-bold text-foreground">Позиції чека</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {items.length} найменувань · {items.reduce((s, i) => s + i.quantity, 0).toFixed(0)} одиниць
        </p>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            <th className="px-5 py-3 text-left w-8">#</th>
            <th className="px-5 py-3 text-left">Товар</th>
            <th className="px-5 py-3 text-center w-24">К-сть</th>
            <th className="px-5 py-3 text-right w-32">Ціна</th>
            <th className="px-5 py-3 text-right w-32">Сума</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item, i) => (
            <tr key={item.id} className="hover:bg-muted/20">
              <td className="px-5 py-3.5 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                    <PackageIcon className="size-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{item.productNameSnapshot}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {UNIT_LABELS[item.unitSnapshot] ?? item.unitSnapshot}
                      {item.taxRateSnapshot > 0 && <> · ПДВ {(item.taxRateSnapshot * 100).toFixed(0)}%</>}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 text-center tabular-nums text-foreground font-medium">
                {fmtQty(item.quantity)}
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums text-foreground">
                {fmt(item.originalUnitPrice)} грн.
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums font-bold text-foreground">
                {fmt(item.lineTotal)} грн.
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totals */}
    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Підсумок ({items.length} поз.)</span>
        <span className="tabular-nums text-foreground">{fmt(subtotal)} грн.</span>
      </div>
      {discountTotal > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TagIcon className="size-3" /> Знижка
          </span>
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">−{fmt(discountTotal)} грн.</span>
        </div>
      )}
      {pointsRedeemed > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Бонуси списано</span>
          <span className="tabular-nums text-foreground">−{pointsRedeemed} балів</span>
        </div>
      )}
      <div className="flex justify-between text-base pt-2 border-t border-border">
        <span className="font-bold text-foreground">Усього до оплати</span>
        <span className="font-bold text-foreground tabular-nums text-lg">{fmt(grandTotal)} грн.</span>
      </div>
      {taxTotal > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>У т.ч. ПДВ</span>
          <span className="tabular-nums">{fmt(taxTotal)} грн.</span>
        </div>
      )}
      {pointsEarned > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Бонусів нараховано</span>
          <span className="tabular-nums">+{pointsEarned} балів</span>
        </div>
      )}
    </div>
  </div>
)

export { OrderItemsTable }
