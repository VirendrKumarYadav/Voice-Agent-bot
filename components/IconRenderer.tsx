import * as icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { FALLBACK_ICON, type IconName } from "@/lib/diagramSchema";

const iconMap = icons as unknown as Record<
  string,
  React.ComponentType<LucideProps>
>;

export function IconRenderer({
  name,
  ...props
}: { name: IconName } & LucideProps) {
  const Icon = iconMap[name] ?? iconMap[FALLBACK_ICON];
  return <Icon {...props} />;
}
