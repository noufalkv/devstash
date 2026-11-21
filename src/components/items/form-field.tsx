import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id?: string;
  label: string;
  /** Optional control shown at the right of the label row. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** A label stacked above its input. */
export function FormField({ id, label, action, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {action ? (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id}>{label}</Label>
          {action}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      {children}
    </div>
  );
}
