import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Image, ArrowRight, ShieldCheck } from 'lucide-react';
import { parseVietQR, openBankingApp, ParsedVietQR, BANK_SCHEMES } from '../../utils/vietQrHelper';
import { useAppStore } from '../../stores/useAppStore';

export const QrScannerModal: React.FC = () => {
  const { isQrOpen, setIsQrOpen, addTransaction } = useAppStore();
  const [scannedData, setScannedData] = useState<ParsedVietQR | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('BIDV');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [customNote, setCustomNote] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isQrOpen && isScanning) {
      const scanner = new Html5Qrcode('qr-reader-viewport');
      qrRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            const parsed = parseVietQR(decoded);
            setScannedData(parsed);
            setSelectedBank(parsed.bankName || 'BIDV');
            setCustomAmount(parsed.amount || 200000);
            setCustomNote(parsed.note || 'Thanh toán ăn uống');
            setIsScanning(false);
            scanner.stop().catch(() => {});
          },
          () => {}
        )
        .catch(() => {});

      return () => {
        if (scanner.isScanning) scanner.stop().catch(() => {});
      };
    }
  }, [isQrOpen, isScanning]);

  if (!isQrOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const scanner = new Html5Qrcode('temp-qr-file');
    scanner
      .scanFile(file, true)
      .then((decoded) => {
        const parsed = parseVietQR(decoded);
        setScannedData(parsed);
        setSelectedBank(parsed.bankName || 'BIDV');
        setCustomAmount(parsed.amount || 200000);
        setCustomNote(parsed.note || 'Thanh toán ăn uống');
        setIsScanning(false);
      })
      .catch(() => alert('Không tìm thấy mã VietQR hợp lệ'));
  };

  const handleConfirmAndPay = () => {
    addTransaction({
      amount: customAmount,
      type: 'expense',
      category: 'Ăn uống',
      bankName: selectedBank,
      note: customNote,
      dateStr: new Date().toISOString().split('T')[0],
    });
    openBankingApp(selectedBank, scannedData?.rawText);
    setIsQrOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-ios-fade">
      <div id="temp-qr-file" className="hidden" />
      <div className="w-full max-w-md bg-[#F7F7F5] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 animate-ios-sheet">
        <button
          type="button"
          onClick={() => setIsQrOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black z-20 cursor-pointer"
        >
          <X size={18} />
        </button>

        {isScanning ? (
          <div>
            <div className="text-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Quét là ghi · Trả xong vào sổ
              </span>
              <h3 className="text-xl font-black text-[#18181B] mt-2">Quét QR Thanh Toán</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Đặt mã VietQR vào khung ngắm camera</p>
            </div>

            <div className="relative w-full aspect-square max-h-[260px] bg-black rounded-3xl overflow-hidden mb-4 border-2 border-neutral-300">
              <div id="qr-reader-viewport" className="w-full h-full object-cover" />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[2px] bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse pointer-events-none" />
              <div className="absolute inset-6 border-2 border-white/40 rounded-2xl pointer-events-none" />
            </div>

            <label className="w-full py-3 bg-white text-neutral-700 font-bold text-xs rounded-2xl border border-neutral-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition">
              <Image size={15} /> Tải ảnh QR từ thư viện máy
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="animate-ios-fade">
            <div className="text-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck size={12} /> Đã nhận diện mã VietQR
              </span>
              <h3 className="text-xl font-black text-[#18181B] mt-2">Kiểm tra khoản chi</h3>
              <p className="text-xs text-neutral-400">Người nhận: Điểm chấp nhận thanh toán</p>
            </div>

            <div className="text-center py-4">
              <div className="flex items-center justify-center">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="text-4xl font-black text-[#18181B] text-center w-60 bg-transparent focus:outline-none"
                />
                <span className="text-2xl font-bold ml-1 text-neutral-800">đ</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 mb-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Danh mục</span>
                <span className="font-bold text-[#18181B]">Ăn uống</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Ghi chú</span>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="font-semibold text-right text-neutral-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 px-1">
                Mở bằng ứng dụng ngân hàng
              </span>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(BANK_SCHEMES).slice(0, 3).map((bank) => (
                  <button
                    type="button"
                    key={bank.name}
                    onClick={() => setSelectedBank(bank.name)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedBank === bank.name
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    {bank.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmAndPay}
              className="w-full py-4 bg-[#18181B] hover:bg-black active:scale-[0.97] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Mở {selectedBank} để chuyển <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
