import { Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Zap className="h-4 w-4" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight">
        SOS <span className="text-muted-foreground">admin</span>
      </span>
    </div>
  );
}
