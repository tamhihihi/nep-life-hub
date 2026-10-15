import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, 
  Image, 
  Camera, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { parseVietQR, openBankingApp, ParsedVietQR, BANK_SCHEMES } from '../../utils/vietQrHelper';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const QrScannerModal: React.FC = () => {
  const { isQrOpen, setIsQrOpen, addTransaction } = useAppStore();
  const [scannedData, setScannedData] = useState<ParsedVietQR | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('MB Bank');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [copiedAcc, setCopiedAcc] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Xử lý dữ liệu ngay khi quét thành công
  const handleDecodeSuccess = (decodedText: string) => {
    sounds.playChime();
    const parsed = parseVietQR(decodedText);
    setScannedData(parsed);
    setSelectedBank(parsed.bankName || 'MB Bank');
    setCustomAmount(parsed.amount > 0 ? parsed.amount.toString() : '');
    setCustomNote(parsed.note || 'Thanh toan an uong');
    setIsScanning(false);
  };

  // Reset trạng thái mỗi khi mở Modal và bật Camera trực tiếp
  useEffect(() => {
    let isMounted = true;

    if (!isQrOpen) {
      return;
    }

    setScannedData(null);
    setIsScanning(true);
    setCameraError(null);
    setCopiedAcc(false);

    // Kiểm tra xem trình duyệt có cấp quyền Camera trực tiếp không (cần HTTPS hoặc localhost)
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Trình duyệt chặn Camera trực tiếp khi mở qua Wi-Fi nội bộ (HTTP). Hãy bấm "Chụp ảnh QR" hoặc "Chọn ảnh QR" bên dưới!'
      );
      return;
    }

    const startCamera = async () => {
      try {
        // Đợi DOM render xong khung ngắm
        await new Promise((r) => setTimeout(r, 150));
        if (!isMounted) return;

        const scanner = new Html5Qrcode('qr-reader-viewport');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (!isMounted) return;
            scanner.stop().catch(() => {});
            handleDecodeSuccess(decoded);
          },
          () => {}
        );
      } catch {
        if (isMounted) {
          setCameraError(
            'Không thể bật Camera trực tiếp. Bạn hãy dùng nút "Chụp ảnh QR" hoặc "Tải ảnh QR" bên dưới nhé!'
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        const s = scannerRef.current;
        if (s.isScanning) {
          s.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, [isQrOpen]);

  if (!isQrOpen) return null;

  // Hàm phụ trợ: Nén và chuẩn hóa ảnh nếu ảnh chụp màn hình quá lớn
  const resizeImageForQr = (file: File, maxDim = 1200): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], 'qr-resized.jpg', { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  };

  // Xử lý khi người dùng Chụp ảnh hoặc Tải ảnh QR từ máy
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setIsProcessingFile(true);

    // Dừng camera live nếu đang chạy
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }

    try {
      // Cách 1: Thử dùng BarcodeDetector phần cứng của trình duyệt (nếu có)
      if ('BarcodeDetector' in window) {
        try {
          // @ts-expect-error BarcodeDetector API
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const bitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(bitmap);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            setIsProcessingFile(false);
            handleDecodeSuccess(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Chuyển sang Cách 2
        }
      }

      // Cách 2: Dùng Html5Qrcode scanFile (truyền false để không cần vẽ lên thẻ ẩn)
      const fileScanner = new Html5Qrcode('temp-qr-file');
      try {
        const decoded = await fileScanner.scanFile(file, false);
        setIsProcessingFile(false);
        handleDecodeSuccess(decoded);
        return;
      } catch {
        // Cách 3: Chuẩn hóa kích thước ảnh rồi quét lại lần nữa
        const resizedFile = await resizeImageForQr(file, 1000);
        const decodedRetry = await fileScanner.scanFile(resizedFile, false);
        setIsProcessingFile(false);
        handleDecodeSuccess(decodedRetry);
        return;
      }
    } catch {
      setIsProcessingFile(false);
      alert('Không nhận diện được mã QR trong ảnh này. Hãy thử chụp rõ nét hơn hoặc cắt gọn vào vùng mã QR nhé!');
    } finally {
      e.target.value = '';
    }
  };

  const handleCopyAccount = () => {
    if (!scannedData?.accountNumber) return;
    navigator.clipboard?.writeText(scannedData.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleConfirmAndPay = () => {
    const finalAmount = parseInt(customAmount, 10) || 0;
    if (finalAmount <= 0) {
      alert('Vui lòng nhập số tiền cần thanh toán!');
      return;
    }

    addTransaction({
      amount: finalAmount,
      type: 'expense',
      category: 'Ăn uống',
      bankName: selectedBank,
      note: customNote || 'Quét QR thanh toán',
      dateStr: new Date().toISOString().split('T')[0],
    });

    openBankingApp(selectedBank, scannedData?.rawText);
    setIsQrOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-ios-fade">
      {/* Khung phụ trợ có kích thước thật nằm ngoài màn hình để Html5Qrcode không bị lỗi 0px */}
      <div
        id="temp-qr-file"
        style={{ width: '300px', height: '300px', position: 'fixed', left: '-9999px', top: '-9999px' }}
      />

      <div className="w-full max-w-md bg-[#F7F7F5] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 animate-ios-sheet max-h-[92vh] overflow-y-auto no-scrollbar">
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
              <p className="text-xs text-neutral-400 mt-0.5">
                Đặt mã VietQR vào khung ngắm hoặc chụp/tải ảnh QR
              </p>
            </div>

            {/* Khung Camera Live */}
            <div className="relative w-full aspect-square max-h-[250px] bg-[#18181B] rounded-3xl overflow-hidden mb-4 border-2 border-neutral-300 flex items-center justify-center">
              <div id="qr-reader-viewport" className="w-full h-full object-cover" />

              {cameraError ? (
                <div className="absolute inset-0 bg-[#18181B] p-5 flex flex-col items-center justify-center text-center text-white">
                  <AlertCircle size={28} className="text-amber-400 mb-2" />
                  <p className="text-xs text-neutral-300 leading-relaxed">{cameraError}</p>
                </div>
              ) : (
                <>
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[2px] bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse pointer-events-none" />
                  <div className="absolute inset-6 border-2 border-white/40 rounded-2xl pointer-events-none" />
                </>
              )}

              {isProcessingFile && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20">
                  <RefreshCw size={24} className="animate-spin text-amber-400 mb-2" />
                  <span className="text-xs font-bold">Đang đọc mã QR...</span>
                </div>
              )}
            </div>

            {/* 2 nút hỗ trợ mọi thiết bị (Kể cả khi không có HTTPS) */}
            <div className="grid grid-cols-2 gap-2.5">
              <label className="py-3.5 px-3 bg-[#18181B] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition">
                <Camera size={16} className="text-amber-400 shrink-0" />
                <span>Chụp ảnh QR</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="py-3.5 px-3 bg-white text-neutral-800 font-extrabold text-xs rounded-2xl border border-neutral-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition">
                <Image size={16} className="text-neutral-600 shrink-0" />
                <span>Chọn ảnh có sẵn</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="animate-ios-fade">
            <div className="text-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck size={12} /> Đã nhận diện mã VietQR
              </span>
              <h3 className="text-xl font-black text-[#18181B] mt-2">Kiểm tra khoản chi</h3>
            </div>

            {/* Thông tin Ngân hàng & Số tài khoản trích xuất từ QR */}
            {scannedData && (
              <div className="bg-white rounded-2xl p-3.5 border border-neutral-200/80 mb-3 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                    Tài khoản thụ hưởng ({scannedData.bankName})
                  </span>
                  <span className="text-sm font-black text-[#18181B] font-mono">
                    {scannedData.accountNumber || 'Mã QR Thanh Toán'}
                  </span>
                </div>
                {scannedData.accountNumber && (
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedAcc ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedAcc ? 'Đã chép' : 'Chép STK'}
                  </button>
                )}
              </div>
            )}

            {/* Nhập số tiền (Nếu mã QR tĩnh của quán chưa có sẵn số tiền) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 mb-3 text-center">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Số tiền thanh toán (VNĐ)
              </span>
              <div className="flex items-center justify-center">
                <input
                  type="number"
                  placeholder="Nhập số tiền..."
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="text-3xl font-black text-[#18181B] text-center w-52 bg-transparent focus:outline-none border-b border-dashed border-neutral-300 pb-1"
                  autoFocus
                />
                <span className="text-xl font-bold ml-1 text-neutral-800">đ</span>
              </div>

              {/* Gợi ý nhanh số tiền */}
              <div className="flex justify-center gap-1.5 mt-3">
                {[35000, 45000, 50000, 100000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setCustomAmount(amt.toString())}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[11px] font-bold text-neutral-700 transition cursor-pointer"
                  >
                    {(amt / 1000).toFixed(0)}k
                  </button>
                ))}
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
                  className="font-semibold text-right text-neutral-800 focus:outline-none border-b border-transparent focus:border-neutral-300"
                />
              </div>
            </div>

            <div className="mb-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 px-1">
                Mở bằng ứng dụng ngân hàng của bạn
              </span>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(BANK_SCHEMES).slice(0, 6).map((bank) => (
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

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmAndPay}
                className="w-full py-4 bg-[#18181B] hover:bg-black active:scale-[0.97] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                Ghi sổ & Mở {selectedBank} <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="w-full py-2.5 bg-neutral-200/70 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Quét lại mã khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};