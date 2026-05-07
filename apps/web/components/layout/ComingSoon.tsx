import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  module: string;
  phase: string;
  description: string;
}

export function ComingSoon({ module, phase, description }: ComingSoonProps) {
  return (
    <div className="px-8 py-8">
      <Card className="max-w-2xl">
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {phase}
          </p>
          <h2 className="text-lg font-semibold">{module} — coming soon</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
