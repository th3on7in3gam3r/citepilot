import { authSubmitClass } from "@/components/auth/auth-styles";

export function AuthSubmitButton({
  pending,
  pendingLabel,
  label,
  disabled,
}: {
  pending: boolean;
  pendingLabel: string;
  label: string;
  disabled?: boolean;
}) {
  const isDisabled = pending || disabled;
  return (
    <button type="submit" disabled={isDisabled} className={authSubmitClass}>
      {pending ? pendingLabel : label}
    </button>
  );
}
