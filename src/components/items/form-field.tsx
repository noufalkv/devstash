import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id?: string;
  label: string;
  children: React.ReactNode;
}

/** A label stacked above its input. */
export function FormField({ id, label, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
