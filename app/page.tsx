'use client';

import { UIButton } from '@/components/ui/button';
import { UITextField } from '@/components/ui/text-field';
import { UITypography } from '@/components/ui/typography';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-8 sm:p-20 font-sans">
      <main className="flex flex-col gap-8 items-center sm:items-start w-full max-w-lg p-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl">
        <UITypography variant="h4" component="h1" fontWeight="bold">
          Shop Manager
        </UITypography>

        <UITypography variant="body1" color="textSecondary">
          Material UI v6 + Tailwind CSS 4 Integration
        </UITypography>

        <UITextField
          fullWidth
          label="Поиск товаров"
          variant="outlined"
          placeholder="Начните вводить название..."
        />

        <div className="flex gap-4 w-full">
          <UIButton variant="contained" color="primary" fullWidth size="large">
            Добавить товар
          </UIButton>
          <UIButton variant="outlined" color="secondary" fullWidth size="large">
            Отмена
          </UIButton>
        </div>
      </main>
    </div>
  );
}

