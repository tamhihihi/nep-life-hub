export const BANK_SCHEMES: Record<string, { name: string; scheme: string; bin: string }> = {
  '970422': { name: 'MB Bank', scheme: 'mbmobile://', bin: '970422' },
  '970418': { name: 'BIDV', scheme: 'bidvsmartbanking://', bin: '970418' },
  '970436': { name: 'Vietcombank', scheme: 'vcbdigibank://', bin: '970436' },
  '970415': { name: 'VietinBank', scheme: 'vietinbankipay://', bin: '970415' },
  '970407': { name: 'Techcombank', scheme: 'tcb://', bin: '970407' },
  '970423': { name: 'TPBank', scheme: 'tpbank://', bin: '970423' },
};

export interface ParsedVietQR {
  bankName: string;
  amount: number;
  note: string;
  rawText: string;
}

export function parseVietQR(qrString: string): ParsedVietQR {
  const result: ParsedVietQR = {
    bankName: 'MB Bank',
    amount: 0,
    note: 'Thanh toán ăn uống',
    rawText: qrString,
  };

  try {
    let index = 0;
    while (index < qrString.length) {
      const tag = qrString.substring(index, index + 2);
      const length = parseInt(qrString.substring(index + 2, index + 4), 10);
      const value = qrString.substring(index + 4, index + 4 + length);
      index += 4 + length;

      if (tag === '54') result.amount = parseFloat(value);
      if (tag === '62') {
        let subIndex = 0;
        while (subIndex < value.length) {
          const subTag = value.substring(subIndex, subIndex + 2);
          const subLen = parseInt(value.substring(subIndex + 2, subIndex + 4), 10);
          const subVal = value.substring(subIndex + 4, subIndex + 4 + subLen);
          subIndex += 4 + subLen;
          if (subTag === '08') result.note = subVal;
        }
      }
      if (tag === '38') {
        for (const [bin, info] of Object.entries(BANK_SCHEMES)) {
          if (value.includes(bin)) {
            result.bankName = info.name;
            break;
          }
        }
      }
    }
  } catch {
    const numericMatch = qrString.match(/\d{4,}/);
    if (numericMatch && result.amount === 0) {
      const possible = parseInt(numericMatch[0], 10);
      if (possible >= 10000 && possible <= 50000000) result.amount = possible;
    }
  }
  return result;
}

export function openBankingApp(bankName: string, rawQrData?: string) {
  const matched = Object.values(BANK_SCHEMES).find((b) => b.name === bankName);
  if (matched) {
    window.location.href = `${matched.scheme}qrpay?data=${encodeURIComponent(rawQrData || '')}`;
  } else {
    window.location.href = 'mbmobile://';
  }
}
