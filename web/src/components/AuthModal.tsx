import React, { useState } from 'react';
import { Building2, CheckCircle2, KeyRound, LogIn, Sparkles, Store, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { StoreAccount } from '../types';
import { Badge, Button, Card, Segmented, cn, inputBase, labelClass, type SegmentedOption } from './ui';

interface AuthModalProps {
  open: boolean;
  currentAccount: StoreAccount | null;
  onClose: () => void;
  onAuthenticated: (account: StoreAccount, isNewRegistration: boolean) => void;
}

type AuthTab = 'login' | 'register';

const AUTH_OPTIONS: SegmentedOption<AuthTab>[] = [
  { value: 'login', label: 'Masuk Akun Toko' },
  { value: 'register', label: 'Daftar Toko Baru' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ open, currentAccount, onClose, onAuthenticated }) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login form
  const [identifier, setIdentifier] = useState('owner@stickeria.id');
  const [password, setPassword] = useState('stickeria2026');

  // Register form
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [shopeeHandle, setShopeeHandle] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal masuk ke akun toko');
      }
      toast.success(`Selamat datang kembali di ${data.account.storeName}!`);
      onAuthenticated(data.account, false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal masuk');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat akun demo');
      }
      toast.success('Masuk ke Akun Demo Toko: Stickeria');
      onAuthenticated(data.account, false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal masuk akun demo');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !email.trim()) {
      setErrorMsg('Nama Toko dan Email wajib diisi.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          ownerName: ownerName.trim() || 'Pemilik Toko',
          email: email.trim(),
          phone: whatsappNumber.trim(),
          whatsappNumber: whatsappNumber.trim(),
          shopeeHandle: shopeeHandle.trim(),
          bankAccount: bankAccount.trim(),
          password: regPassword || 'password123',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mendaftarkan toko baru');
      }
      toast.success(`Toko "${data.account.storeName}" berhasil dibuat! Lanjutkan koneksi WA & Shopee.`);
      onAuthenticated(data.account, true);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mendaftarkan toko');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Autentikasi Akun Penjual ReplyForge"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm animate-fade-in"
    >
      <Card padding="lg" className="relative w-full max-w-md border-amber-300/80 bg-surface shadow-pop">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-sm font-extrabold text-zinc-950 shadow-gold">
              RF
            </span>
            <div>
              <h2 className="text-base font-bold text-ink-1">Akun Penjual ReplyForge</h2>
              <p className="text-xs text-ink-3">Masuk atau daftarkan toko UMKM Anda untuk menghubungkan WhatsApp Business &amp; Shopee</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog akun"
            className="interactive-tap grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-nested hover:text-ink-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {currentAccount && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-amber-300/70 bg-elevated px-3.5 py-2.5 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-ink-1">Aktif: {currentAccount.storeName}</span>
              <span className="ml-1.5 text-ink-3">({currentAccount.email})</span>
            </div>
            <Badge tone="emerald" icon={CheckCircle2}>
              Sesi Aktif
            </Badge>
          </div>
        )}

        <Segmented value={tab} onChange={setTab} options={AUTH_OPTIONS} ariaLabel="Pilih masuk atau daftar toko" size="sm" className="mb-4" />

        {errorMsg && (
          <div role="alert" className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
            {errorMsg}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label htmlFor="rf-login-id" className={labelClass}>
                Email atau Nomor WhatsApp Toko
              </label>
              <input
                id="rf-login-id"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="owner@stickeria.id atau 085183250750"
                className={cn(inputBase, 'h-11 rounded-xl px-3.5 text-body')}
              />
            </div>
            <div>
              <label htmlFor="rf-login-pw" className={labelClass}>
                Kata Sandi
              </label>
              <input
                id="rf-login-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(inputBase, 'h-11 rounded-xl px-3.5 text-body')}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth icon={LogIn} loading={loading}>
              Masuk ke Dashboard Toko
            </Button>

            <div className="relative py-1.5 text-center">
              <span className="bg-surface px-2 text-2xs uppercase tracking-wider text-ink-3">Atau Akses Cepat</span>
            </div>

            <Button type="button" variant="secondary" fullWidth icon={Sparkles} loading={loading} onClick={handleDemoLogin}>
              Masuk Cepat Akun Demo (Stickeria)
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="rf-reg-store" className={labelClass}>
                  Nama Toko UMKM *
                </label>
                <input
                  id="rf-reg-store"
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Misal: Berkah Aksesoris"
                  className={cn(inputBase, 'h-10 rounded-xl px-3 text-xs')}
                />
              </div>
              <div>
                <label htmlFor="rf-reg-owner" className={labelClass}>
                  Nama Pemilik / Admin
                </label>
                <input
                  id="rf-reg-owner"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Nama Anda"
                  className={cn(inputBase, 'h-10 rounded-xl px-3 text-xs')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="rf-reg-email" className={labelClass}>
                  Email Penjual *
                </label>
                <input
                  id="rf-reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toko@email.com"
                  className={cn(inputBase, 'h-10 rounded-xl px-3 text-xs')}
                />
              </div>
              <div>
                <label htmlFor="rf-reg-pw" className={labelClass}>
                  Kata Sandi Baru *
                </label>
                <input
                  id="rf-reg-pw"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className={cn(inputBase, 'h-10 rounded-xl px-3 text-xs')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="rf-reg-wa" className={labelClass}>
                  Nomor WhatsApp Business
                </label>
                <input
                  id="rf-reg-wa"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="0851-xxxx-xxxx"
                  className={cn(inputBase, 'h-10 rounded-xl px-3 text-xs')}
                />
              </div>
              <div>
                <label htmlFor="rf-reg-shopee" className={labelClass}>
                  Username Shopee Seller
                </label>
                <input
                  id="rf-reg-shopee"
                  type="text"
                  value={shopeeHandle}
                  onChange={(e) => setShopeeHandle(e.target.value)}
                  placeholder="@namatoko.id"
                  className={cn(inputBase, 'h-10 rounded-xl px-3 text-xs')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="rf-reg-bank" className={labelClass}>
                Rekening Bank Pembayaran Toko
              </label>
              <input
                id="rf-reg-bank"
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="BCA 1234567890 a.n. Nama Toko"
                className={cn(inputBase, 'h-10 rounded-xl px-3 text-xs')}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth icon={UserPlus} loading={loading}>
              Daftarkan Toko &amp; Lanjut Koneksi Channel
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
