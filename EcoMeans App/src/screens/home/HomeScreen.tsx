import { CalendarDays, ChevronRight, ShoppingCart, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { formatFullDate, todayISO } from '@/lib/dates';
import { compareByDueDate, isDoneToday, isOnToday } from '@/lib/tasks';
import { TaskRow } from '@/components/tasks/TaskRow';
import { ProgressBar } from '@/components/ui/controls';
import { ProductImage } from '@/components/ui/ProductImage';
import { PRODUCTS } from '@/data/products';
import { TIPS } from '@/data/tips';

export function HomeScreen() {
  const { state, toggleTaskDone } = useAppStore();
  const { navigate, resetTo } = useNavigation();
  const { showToast } = useToast();

  const today = todayISO();
  const dayIndex = Number(today.replace(/-/g, ''));
  const tip = TIPS[dayIndex % TIPS.length];
  const product = PRODUCTS[dayIndex % PRODUCTS.length];

  const todayTasks = state.tasks
    .filter((task) => isOnToday(task, today))
    .sort((a, b) => Number(isDoneToday(a, today)) - Number(isDoneToday(b, today)) || compareByDueDate(a, b));
  const doneCount = todayTasks.filter((task) => isDoneToday(task, today)).length;
  const name = state.profile.name.trim();
  const openShopping = state.shoppingItems.filter((item) => !item.bought).length;

  const handleToggle = (taskId: string, done: boolean) => {
    toggleTaskDone(taskId);
    showToast(done ? 'Cofnięto zadanie' : 'Zadanie wykonane. Świetnie!');
  };

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="flex items-center justify-between pb-5">
        <div>
          <p className="text-sm font-semibold text-ink-500">{formatFullDate(today)}</p>
          <h1 className="mt-0.5 text-2xl font-bold leading-tight text-ink-900">
            {name ? `Dzień dobry, ${name}` : 'Dzień dobry'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate({ name: 'shopping' })}
          aria-label="Lista zakupów"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-800 shadow-card transition active:scale-95"
        >
          <ShoppingCart size={20} />
          {openShopping > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
              {openShopping}
            </span>
          )}
        </button>
      </header>

      <section className="rounded-3xl bg-brand-700 p-5 text-white shadow-lift">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-100">
          <Sparkles size={16} /> Na dziś
        </div>
        <p className="mt-2 text-2xl font-bold">
          {todayTasks.length === 0
            ? 'Brak zadań na dziś'
            : doneCount === todayTasks.length
              ? 'Wszystko gotowe'
              : `Zostało ${todayTasks.length - doneCount} z ${todayTasks.length}`}
        </p>
        <ProgressBar value={doneCount} max={todayTasks.length} className="mt-4 bg-white/25 [&>div]:from-white [&>div]:to-brand-200" />
        <p className="mt-2 text-xs text-brand-100">Wykonane: {doneCount}</p>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-bold text-ink-900">Zadania na dziś</h2>
        {todayTasks.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-ink-500 shadow-card">
            Nic do zrobienia. Możesz odpocząć albo dodać nowe zadanie w sekcji Mój dom.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {todayTasks.map((task) => {
              const done = isDoneToday(task, today);
              return <TaskRow key={task.id} task={task} today={today} done={done} onToggle={() => handleToggle(task.id, done)} />;
            })}
          </ul>
        )}
      </section>

      <section className="mt-7 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => resetTo({ name: 'rooms' })}
          className="flex flex-col items-start gap-3 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
            <CalendarDays size={20} />
          </span>
          <span className="text-sm font-bold text-ink-900">Harmonogram sprzątania</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ name: 'shopping' })}
          className="flex flex-col items-start gap-3 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 text-sand-700">
            <ShoppingCart size={20} />
          </span>
          <span className="text-sm font-bold text-ink-900">Lista zakupów</span>
        </button>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-bold text-ink-900">Porada dnia</h2>
        <button
          type="button"
          onClick={() => navigate({ name: 'tip', tipId: tip.id })}
          className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-snug text-ink-900">{tip.title}</p>
            <p className="mt-1 text-sm text-ink-500">{tip.summary}</p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-ink-400" />
        </button>
      </section>

      <section className="mt-7 pb-4">
        <h2 className="mb-3 text-lg font-bold text-ink-900">Polecany produkt</h2>
        <button
          type="button"
          onClick={() => navigate({ name: 'product', productId: product.id })}
          className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
        >
          <ProductImage categoryId={product.categoryId} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink-900">{product.name}</p>
            <p className="mt-1 text-sm text-ink-500">{product.shortUse}</p>
            <p className="mt-2 text-sm font-semibold text-brand-700">Zobacz kartę produktu</p>
          </div>
        </button>
      </section>
    </div>
  );
}
