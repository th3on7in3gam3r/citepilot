export type PasswordChecks = {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
};

export function checkPasswordRequirements(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

export function passwordMeetsRequirements(password: string): boolean {
  const c = checkPasswordRequirements(password);
  return c.minLength && c.hasLetter && c.hasNumber;
}
