export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || typeof accountNumber !== 'string') return '';
  if (accountNumber.length <= 4) return '**** ' + accountNumber;
  const last4 = accountNumber.slice(-4);
  const maskedLength = accountNumber.length - 4;
  return '*'.repeat(maskedLength) + last4;
};
