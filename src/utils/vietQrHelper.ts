export const BANK_SCHEMES: Record<string, { name: string; scheme: string; bin: string }> = {
  '970422': { name: 'MB Bank', scheme: 'mbmobile://', bin: '970422' },
  '970418': { name: 'BIDV', scheme: 'bidvsmartbanking://', bin: '970418' },
  '970436': { name: 'Vietcombank', scheme: 'vcbdigibank://', bin: '970436' },
  '970415': { name: 'VietinBank', scheme: 'vietinbankipay://', bin: '970415' },
  '970407': { name: 'Techcombank', scheme: 'techcombank://', bin: '970407' },
  '970423': { name: 'TPBank', scheme: 'tpbank://', bin: '970423' },
  '970416': { name: 'ACB', scheme: 'acbapp://', bin: '970416' },
  '970432': { name: 'VPBank', scheme: 'vpbankneo://', bin: '970432' },
  '970405': { name: 'Agribank', scheme: 'agribankemobilebanking://', bin: '970405' },
  '970403': { name: 'Sacombank', scheme: 'sacombankpay://', bin: '970403' },
};

export interface ParsedVietQR {
  bankName: string;
  bankBin: string;
  accountNumber: string;
  amount: number;
  note: string;
  rawText: string;
}

// Hàm giải mã cấu trúc TLV chuẩn EMVCo của VietQR / NAPAS
function parseTLV(data: string): Record<string, string> {
  const result: Record<string, string> = {};
  let i = 0;
  while (i + 4 <= data.length) {
    const tag = data.substring(i, i + 2);
    const len = parseInt(data.substring(i + 2, i + 4), 10);
    if (isNaN(len) || len < 0 || i + 4 + len > data.length) {
      break;
    }
    result[tag] = data.substring(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return result;
}

export function parseVietQR(qrString: string): ParsedVietQR {
  const cleanStr = qrString.trim();
  const result: ParsedVietQR = {
    bankName: 'MB Bank',
    bankBin: '970422',
    accountNumber: '',
    amount: 0,
    note: 'Thanh toan an uong',
    rawText: cleanStr,
  };

  try {
    const root = parseTLV(cleanStr);

    // 1. Lấy số tiền (Tag 54)
    if (root['54']) {
      const parsedAmount = parseFloat(root['54']);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        result.amount = Math.round(parsedAmount);
      }
    }

    // 2. Lấy thông tin Ngân hàng & Số tài khoản (Tag 38 - VietQR NAPAS)
    if (root['38']) {
      const tag38 = parseTLV(root['38']);
      if (tag38['01']) {
        const beneficiary = parseTLV(tag38['01']);
        const bin = beneficiary['00'];
        const acc = beneficiary['01'];

        if (bin && BANK_SCHEMES[bin]) {
          result.bankBin = bin;
          result.bankName = BANK_SCHEMES[bin].name;
        } else if (bin) {
          result.bankBin = bin;
          result.bankName = `Ngân hàng (${bin})`;
        }

        if (acc) {
          result.accountNumber = acc;
        }
      } else {
        // Fallback tìm BIN trong chuỗi Tag 38
        for (const [bin, info] of Object.entries(BANK_SCHEMES)) {
          if (root['38'].includes(bin)) {
            result.bankBin = bin;
            result.bankName = info.name;
            break;
          }
        }
      }
    }

    // 3. Lấy nội dung chuyển khoản (Tag 62 -> Subtag 08)
    if (root['62']) {
      const tag62 = parseTLV(root['62']);
      if (tag62['08']) {
        result.note = tag62['08'];
      }
    }
  } catch {
    // Nếu là mã QR dạng text thường
  }

  return result;
}

export function openBankingApp(bankName: string, rawQrData?: string) {
  const matched = Object.values(BANK_SCHEMES).find((b) => b.name === bankName);
  const scheme = matched ? matched.scheme : 'mbmobile://';
  window.location.href = rawQrData
    ? `${scheme}qrpay?data=${encodeURIComponent(rawQrData)}`
    : scheme;
}