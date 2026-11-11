import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { toErrorMessage } from '../../lib/format';
import { MOCK_CSV, VOICE_SAMPLE } from './data';

interface Options {
  onRunConversationalCommand: (cmd: string) => Promise<string>;
  onRefreshData: () => void;
}

export interface StockComposer {
  inputText: string;
  setInputText: (value: string) => void;
  isListening: boolean;
  isSubmitting: boolean;
  isImportingCsv: boolean;
  isScanningVision: boolean;
  submit: (text: string) => Promise<void>;
  simulateVoice: () => void;
  importCsv: () => Promise<void>;
  scanVision: () => Promise<void>;
}

/** Logika input perintah cepat (teks/suara), impor CSV, dan scan foto — sama seperti versi lama. */
export function useStockComposer({ onRunConversationalCommand, onRefreshData }: Options): StockComposer {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isScanningVision, setIsScanningVision] = useState(false);
  const voiceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (voiceTimer.current) clearTimeout(voiceTimer.current);
    },
    [],
  );

  const submit = useCallback(
    async (textToRun: string) => {
      if (!textToRun.trim() || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const msg = await onRunConversationalCommand(textToRun);
        toast.success(msg || 'Data berhasil disinkronkan ke SQLite!');
        setInputText('');
        onRefreshData();
      } catch (e) {
        toast.error('Gagal memproses: ' + toErrorMessage(e));
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onRunConversationalCommand, onRefreshData],
  );

  const simulateVoice = useCallback(() => {
    if (isListening) return;
    setIsListening(true);
    toast.info('Mendengarkan suara admin toko...');
    voiceTimer.current = setTimeout(() => {
      setIsListening(false);
      setInputText(VOICE_SAMPLE);
      toast.success('Suara terdeteksi: Stiker & Keychain');
    }, 1200);
  }, [isListening]);

  const importCsv = useCallback(async () => {
    if (isImportingCsv) return;
    setIsImportingCsv(true);
    try {
      const res = await fetch('/api/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: MOCK_CSV }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Berhasil mengimpor ${data.count} produk dari template Shopee!`);
        onRefreshData();
      } else {
        toast.error('Impor CSV tidak berhasil. Coba lagi.');
      }
    } catch {
      toast.error('Gagal mengimpor CSV');
    } finally {
      setIsImportingCsv(false);
    }
  }, [isImportingCsv, onRefreshData]);

  const scanVision = useCallback(async () => {
    if (isScanningVision) return;
    setIsScanningVision(true);
    toast.loading('Memindai katalog foto via Vision OCR...', { id: 'vision' });
    try {
      const res = await fetch('/api/products/scan-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockType: 'shopee_product' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Katalog berhasil diekstrak ke stok toko!', { id: 'vision' });
        onRefreshData();
      } else {
        // Versi lama membiarkan toast "memindai" menggantung selamanya di kasus ini.
        toast.error('Scan tidak menghasilkan data. Coba lagi.', { id: 'vision' });
      }
    } catch {
      toast.error('Gagal scan vision', { id: 'vision' });
    } finally {
      setIsScanningVision(false);
    }
  }, [isScanningVision, onRefreshData]);

  return {
    inputText,
    setInputText,
    isListening,
    isSubmitting,
    isImportingCsv,
    isScanningVision,
    submit,
    simulateVoice,
    importCsv,
    scanVision,
  };
}
