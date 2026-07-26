import { BrandMark } from "../navigation/brand-mark";
import { LoadingState } from "./loading-state";

export function RouteLoading({ label = "Verificando sessão" }: { label?: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center bg-background px-4">
      <BrandMark className="absolute left-5 top-4" />
      <div className="w-full max-w-sm"><LoadingState label={label} /></div>
    </main>
  );
}
