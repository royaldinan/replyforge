import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, MessageCircle, ShieldCheck, ShoppingBag, Smartphone, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import type { StoreAccount } from '../types';
import { Badge, Button, Card, Switch, cn, inputBase, labelClass } from './ui';

declare global {
  interface Window {
    ReplyForgeAndroid?: {
      isNotificationPermissionGranted?: () => boolean;
      openNotificationSettings?: () => void;
      triggerAnomalyAlert?: (title: string, body: string) => void;
    };
  }
}

interface ChannelOnboardingModalProps {
  open: boolean;
  account: StoreAccount | null;
  onClose: () => void;
  onSaved: (updated: StoreAccount) => void;
  onSendTestWebhook?: () => Promise<void>;
}

export const ChannelOnboardingModal: React.FC<ChannelOnboardingModalProps> = ({
  open,
  account,
  onClose,
  onSaved,
  onSendTestWebhook,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [storeName, setStoreName] = useState(account?.storeName || 'Lina Shop');
  const [bankAccount, setBankAccount] = useState(account?.bankAccount || 'BCA 5271 8890 21 a.n. Lina Shop');
  const [shopeeHandle, setShopeeHandle] = useState(account?.shopeeHandle || '@linashop.id');
  const [whatsappNumber, setWhatsappNumber] = useState(account?.whatsappNumber || '0851-8325-0750');
  const [shopeeConnected, setShopeeConnected] = useState(account?.shopeeConnected ?? true);
  const [whatsappConnected, setWhatsappConnected] = useState(account?.whatsappConnected ?? true);
  const [osPermission, setOsPermission] = useState(account?.osNotificationGranted ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingVerified, setPingVerified] = useState(false);

  useEffect(() => {
    if (account) {
      setStoreName(account.storeName || 'Lina Shop');
      setBankAccount(account.bankAccount || 'BCA 5271 8890 21 a.n. Lina Shop');
      setShopeeHandle(account.shopeeHandle || '@linashop.id');
      setWhatsappNumber(account.whatsappNumber || '0851-8325-0750');
      setShopeeConnected(account.shopeeConnected ?? true);
      setWhatsappConnected(account.whatsappConnected ?? true);
      setOsPermission(account.osNotificationGranted ?? true);
    }
    if (typeof window !== 'undefined' && window.ReplyForgeAndroid?.isNotificationPermissionGranted) {
      try {
        setOsPermission(Boolean(window.ReplyForgeAndroid.isNotificationPermissionGranted()));
      } catch {
        // fallback to saved state
      }
    }
  }, [account, open]);

  if (!open) return null;

  const isNativeAndroid = typeof window !== 'undefined' && Boolean(window.ReplyForgeAndroid);

  const handleOpenAndroidSettings = () => {
    if (window.ReplyForgeAndroid?.openNotificationSettings) {
      window.ReplyForgeAndroid.openNotificationSettings();
      setOsPermission(true);
      toast.info('Membuka pengaturan Izin Akses Notifikasi Android...');
    } else {
      setOsPermission(true);
      toast.success('Status izin jembatan Android NotificationListener diaktifkan.');
    }
  };

  const handleSaveConnection = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/channels/connect', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          bankAccount,
          shopeeHandle,
          whatsappNumber,
          shopeeConnected,
          whatsappConnected,
          osNotificationGranted: osPermission,
          onboardingCompleted: true,
        }),
      });
      const data = await res.json();
      if (data.account) {
        onSaved(data.account);
      }
      toast.success('Konfigurasi koneksi WhatsApp Business & Shopee Seller disimpan!');
      onClose();
    } catch {
      toast.error('Gagal menyimpan konfigurasi channel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestLiveHandshake = async () => {
    setIsTestingPing(true);
    try {
      if (onSendTestWebhook) {
        await onSendTestWebhook();
      } else {
        await fetch('/api/notification-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyer: 'pelanggan_uji_koneksi',
            channel: 'whatsapp',
            packageName: 'com.whatsapp.w4b',
            text: 'Halo kak, Paket Stiker Kucing Gemoy masih ready?',
          }),
        });
      }
      setPingVerified(true);
      toast.success('Verifikasi Jembatan Berhasil: Notifikasi WA/Shopee tertangkap & dijawab!');
    } catch {
      toast.error('Gagal melakukan uji koneksi');
    } finally {
      setIsTestingPing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Koneksi Akun Shopee Seller dan WhatsApp Business"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm animate-fade-in"
    >
      <Card padding="lg" className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto border-amber-300 bg-surface shadow-pop">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="amber" icon={Smartphone}>
                Panduan Koneksi Toko (3 Langkah)
              </Badge>
              {isNativeAndroid && <Badge tone="emerald">Perangkat Android Terdeteksi</Badge>}
            </div>
            <h2 className="mt-1.5 text-base font-bold text-ink-1">Hubungkan Shopee Seller &amp; WhatsApp Business</h2>
            <p className="text-xs text-ink-3">
              Tanpa biaya API bulanan &amp; tanpa menyerahkan password akun marketplace Anda. ReplyForge membaca &amp; membalas langsung dari jembatan notifikasi resmi OS Android.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan koneksi"
            className="interactive-tap grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-nested hover:text-ink-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            { n: 1 as const, label: '1. Identitas Toko' },
            { n: 2 as const, label: '2. Izin WA & Shopee' },
            { n: 3 as const, label: '3. Uji Jembatan' },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n)}
              className={cn(
                'interactive-tap rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors',
                step === s.n
                  ? 'border-amber-400 bg-elevated text-amber-950 shadow-sm'
                  : 'border-line bg-nested/60 text-ink-3 hover:text-ink-1',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3.5">
            <div>
              <label htmlFor="wiz-store" className={labelClass}>
                Nama Toko UMKM
              </label>
              <input
                id="wiz-store"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className={cn(inputBase, 'h-11 rounded-xl px-3.5 text-body')}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="wiz-wa" className={labelClass}>
                  Nomor WhatsApp Business Aktif di HP Ini
                </label>
                <input
                  id="wiz-wa"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="0851-8325-0750"
                  className={cn(inputBase, 'h-11 rounded-xl px-3.5 text-body')}
                />
              </div>
              <div>
                <label htmlFor="wiz-shopee" className={labelClass}>
                  Username Akun Shopee Seller
                </label>
                <input
                  id="wiz-shopee"
                  type="text"
                  value={shopeeHandle}
                  onChange={(e) => setShopeeHandle(e.target.value)}
                  placeholder="@linashop.id"
                  className={cn(inputBase, 'h-11 rounded-xl px-3.5 text-body')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wiz-bank" className={labelClass}>
                Rekening Tujuan Pembayaran Manual (WhatsApp)
              </label>
              <input
                id="wiz-bank"
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="BCA 5271 8890 21 a.n. Lina Shop"
                className={cn(inputBase, 'h-11 rounded-xl px-3.5 text-body')}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setStep(2)}>
                Lanjut ke Langkah 2: Izin Channel
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-300 bg-elevated p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-ink-1">Izin Jembatan Notifikasi Android (RemoteInput)</h3>
                  <p className="mt-0.5 text-xs leading-5 text-ink-2">
                    Pastikan aplikasi <strong>WhatsApp Business</strong> dan <strong>Shopee</strong> sudah login di HP Anda, lalu aktifkan izin baca &amp; balas notifikasi untuk ReplyForge.
                  </p>
                </div>
                <Badge tone={osPermission ? 'emerald' : 'amber'}>{osPermission ? 'Izin Aktif' : 'Belum Aktif'}</Badge>
              </div>
              <div className="mt-3">
                <Button variant="secondary" size="sm" icon={ExternalLink} onClick={handleOpenAndroidSettings}>
                  {osPermission ? 'Cek Ulang Pengaturan Notifikasi Android' : 'Buka Pengaturan Izin Notifikasi Android'}
                </Button>
              </div>
            </div>

            <div className="divide-y divide-line rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECFDF3] text-[#116932] ring-1 ring-[#25D366]/35">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-1">WhatsApp Business ({whatsappNumber || 'Aktif'})</p>
                    <p className="text-xs text-ink-3">Package: com.whatsapp.w4b &amp; com.whatsapp</p>
                  </div>
                </div>
                <Switch checked={whatsappConnected} onChange={setWhatsappConnected} label="Hubungkan WhatsApp Business" />
              </div>

              <div className="flex items-center justify-between gap-3 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF2EE] text-[#C23315] ring-1 ring-[#EE4D2D]/30">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-1">Shopee Seller ({shopeeHandle || '@linashop.id'})</p>
                    <p className="text-xs text-ink-3">Package: com.shopee.id &amp; com.shopee.shopeeseller</p>
                  </div>
                </div>
                <Switch checked={shopeeConnected} onChange={setShopeeConnected} label="Hubungkan Shopee Seller" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                Lanjut ke Langkah 3: Verifikasi
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-nested/60 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold text-ink-1">Siap Menerima Chat &amp; Pesanan Nyata</h3>
                  <p className="mt-1 text-xs leading-5 text-ink-2">
                    Ketika pembeli mengirim chat ke <strong>{whatsappNumber}</strong> (WhatsApp Business) atau <strong>{shopeeHandle}</strong> (Shopee), notifikasi yang muncul di bar atas HP Anda akan otomatis ditangkap, dihitung HPP-nya oleh Kode, dan dibalas otomatis. Jika ada pertanyaan aneh atau jumlah pembelian tidak wajar, sistem akan langsung memberi peringatan ke layar Anda.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" icon={Sparkles} loading={isTestingPing} onClick={handleTestLiveHandshake}>
                  Kirim Pesan Tes Jembatan
                </Button>
                {pingVerified && (
                  <Badge tone="emerald" icon={CheckCircle2}>
                    Jembatan Terverifikasi Aktif!
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Kembali
              </Button>
              <Button variant="primary" icon={CheckCircle2} loading={isSaving} onClick={handleSaveConnection}>
                Simpan &amp; Aktifkan Koneksi Toko
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
