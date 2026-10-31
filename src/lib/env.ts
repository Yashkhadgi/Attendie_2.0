export function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing env ${name}`);
  }
  return val;
}

export function requiredSecret(name: string): string {
  const val = required(name);
  if (val.length < 32) {
    throw new Error(`Secret env ${name} must be at least 32 characters`);
  }
  return val;
}
