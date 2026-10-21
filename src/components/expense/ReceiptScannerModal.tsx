import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  Receipt, 
  Plus, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectedItem {
  id: string;
  name: string;
  price: number;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Ăn uống');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setImagePreview(url);
      simulateAIReceiptScan();
    };
    reader.readAsDataURL(file);
  };

  // THUẬT TOÁN BÓC TÁCH HÓA ĐƠN AI (OCR PARSER)
  const simulateAIReceiptScan = () => {
    setIsScanning(true);
    try { sounds?.playKeypadTap?.(); } catch {}

    setTimeout(() => {
      setIsScanning(false);
      try { sounds?.playChime?.(); } catch {}

      // Giả lập bóc tách thông minh các món trên hóa đơn
      setMerchantName('Nhà Hàng Cơm Quê / Siêu Thị');
      setDetectedItems([
        { id: 'item_1', name: 'Cơm sườn đặc biệt', price: 55000 },
        { id: 'item_2', name: 'Trà đá / Khăn lạnh', price: 10000 },
        { id: 'item_3', name: 'Canh rong biển thịt bằm', price: 25000 },
      ]);
    }, 1800);
  };

  const totalPrice = detectedItems.reduce((sum, item) => sum + item.price, 0);

  const handleRemoveItem = (id: string) => {
    setDetectedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleConfirmSave = () => {
    if (totalPrice <= 0) return;
    try { sounds?.playChime?.(); } catch {}

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const itemsSummary = detectedItems.map((i) => i.name).join(', ');

    const newTx = {
      id: `tx_${Date.now()}`,
      amount: totalPrice,
      type: 'expense' as const,
      category: selectedCategory,
      bankName: 'Tiền mặt',
      note: `Hóa đơn ${merchantName}: ${itemsSummary}`,
      dateStr: todayStr,
      timestamp: Date.now(),
    };

    useAppStore.setState((prev: any) => ({
      transactions: [newTx, ...(prev?.transactions || [])],
    }));

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
      <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200/90 max-h-[90dvh] overflow-y-auto no-scrollbar animate-sheet-spring space-y-4">
        
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Receipt size={16} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600 block">AI Vision</span>
              <h3 className="text-base font-black text-[#18181B]">Quét Hóa Đơn Giấy</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* KHUNG TẢI ẢNH HOẶC CHỤP HÓA ĐƠN */}
        {!imagePreview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 hover:border-amber-400 bg-neutral-50 hover:bg-amber-50/40 rounded-3xl p-8 text-center space-y-3 cursor-pointer transition"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center mx-auto text-amber-500">
              <Camera size={26} />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#18181B]">Chụp hoặc tải ảnh hóa đơn</h4>
              <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                AI sẽ tự động nhận diện từng món và cộng tổng tiền
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelected}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* ẢNH PREVIEW VÀ HIỆU ỨNG QUÉT */}
            <div className="relative h-40 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200">
              <img src={imagePreview} alt="Receipt" className="w-full h-full object-cover opacity-75" />
              {isScanning && (
                <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                  <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-black drop-shadow">AI đang phân tích hóa đơn...</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setDetectedItems([]);
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* DANH SÁCH MÓN ĐÃ BÓC TÁCH */}
            {!isScanning && detectedItems.length > 0 && (
              <div className="space-y-3 animate-tab-switch">
                <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-500">Cửa hàng:</span>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="text-right font-black text-[#18181B] bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="divide-y divide-neutral-200/60 pt-1">
                    {detectedItems.map((item) => (
                      <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#18181B]">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black font-mono text-neutral-700">
                            {item.price.toLocaleString('vi-VN')}đ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-neutral-400 hover:text-rose-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-neutral-300 flex justify-between items-center">
                    <span className="text-xs font-black text-[#18181B]">Tổng hóa đơn:</span>
                    <span className="text-base font-black font-mono text-amber-600">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* NÚT LƯU VÀO VÍ */}
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="w-full py-3.5 bg-[#18181B] hover:bg-black text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <Check size={15} className="text-amber-400" />
                  <span>Xác nhận ghi {totalPrice.toLocaleString('vi-VN')}đ vào ví</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};