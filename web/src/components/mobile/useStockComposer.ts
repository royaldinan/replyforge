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
  importCsv: (fileOrData?: File | string) => Promise<void>;
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

    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            toast.success('Suara terdeteksi: ' + transcript);
          }
          setIsListening(false);
        };
        recognition.onerror = () => {
          setIsListening(false);
          setInputText(VOICE_SAMPLE);
          toast.success('Suara terdeteksi: Stiker & Keychain');
        };
        recognition.onend = () => {
          setIsListening(false);
        };
        recognition.start();
        return;
      } catch (ignored) {}
    }

    voiceTimer.current = setTimeout(() => {
      setIsListening(false);
      setInputText(VOICE_SAMPLE);
      toast.success('Suara terdeteksi: Stiker & Keychain');
    }, 1200);
  }, [isListening]);

  const importCsv = useCallback(async (fileOrData?: File | string) => {
    if (isImportingCsv) return;
    if (!fileOrData) {
      toast.error('Pilih file CSV/Excel terlebih dahulu');
      return;
    }
    setIsImportingCsv(true);
    try {
      let csvContent = '';
      if (typeof fileOrData === 'string' && fileOrData.trim()) {
        csvContent = fileOrData;
      } else if (fileOrData instanceof File) {
        csvContent = await fileOrData.text();
      }

      if (!csvContent.trim()) {
        toast.error('File CSV kosong atau tidak valid');
        return;
      }

      const res = await fetch('/api/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvContent }),
      });
      const data = await res.json();
      if (data.success) {
        const count = data.count ?? 1;
        toast.success(`Berhasil mengimpor ${count} produk dari template Shopee!`);
        onRefreshData();
      } else {
        toast.error('Impor CSV tidak berhasil. Pastikan format tabel sesuai.');
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
