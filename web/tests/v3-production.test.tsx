import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('sonner', () => {
  const t: any = vi.fn();
  t.success = vi.fn();
  t.error = vi.fn();
  t.info = vi.fn();
  t.loading = vi.fn();
  return { toast: t, Toaster: () => null };
});

import { AuthModal } from '../src/components/AuthModal';
import { ChannelOnboardingModal } from '../src/components/ChannelOnboardingModal';
import { SellerAlertBanner } from '../src/components/SellerAlertBanner';
import { LiveInboxMonitor } from '../src/components/LiveInboxMonitor';
import { TutorialModal } from '../src/components/TutorialModal';
import type { AnomalyAlert, StoreAccount } from '../src/types';

const sampleAccount: StoreAccount = {
  id: 1,
  email: 'owner@linashop.id',
  phone: '085183250750',
  ownerName: 'Lina Permata',
  storeName: 'Stickeria',
  category: 'Aksesoris & Merchandise Kreatif',
  shopeeHandle: '@linashop.id',
  whatsappNumber: '0851-8325-0750',
  bankAccount: 'SeaBank 901483182051 a.n. Stickeria',
  shopeeConnected: true,
  whatsappConnected: true,
  osNotificationGranted: true,
  onboardingCompleted: true,
};

const sampleAlerts: AnomalyAlert[] = [
  {
    id: 101,
    thread_id: 'whatsapp:hendrik_borong99',
    buyer: 'hendrik_borong99',
    channel: 'whatsapp',
    kind: 'UNUSUAL_QUANTITY',
    severity: 'high',
    title: 'Pesanan Jumlah Tidak Wajar (250 pcs)',
    reason: 'Pembeli hendrik_borong99 meminta 250 pcs Griptok HP Akrilik Bunga Daisy (Stok tersedia: 25 pcs, Batas wajar: 10 pcs).',
    message_text: 'Kak saya mau borong Griptok Bunga Daisy 250 pcs sekarang juga',
    requested_qty: 250,
    sku: 'GPT-FLW-03',
    status: 'open',
    created_at: Date.now(),
  },
  {
    id: 102,
    thread_id: 'shopee:akun_mencurigakan',
    buyer: 'akun_mencurigakan',
    channel: 'shopee',
    kind: 'WEIRD_QUERY',
    severity: 'high',
    title: 'Pertanyaan Aneh / Permintaan Mencurigakan',
    reason: 'Pesan memuat tautan eksternal / file APK mencurigakan dari akun_mencurigakan di SHOPEE.',
    message_text: 'Kak bisa pinjam uang? Cek file undangan.apk ini ya.',
    requested_qty: 0,
    sku: null,
    status: 'open',
    created_at: Date.now(),
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as any).ReplyForgeAndroid;
});

describe('SellerAlertBanner (Eskalasi Pembeli Aneh & Jumlah Tidak Wajar)', () => {
  it('menampilkan daftar peringatan open dan memanggil onResolveAlert & onOpenChat', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const onOpenChat = vi.fn();

    render(<SellerAlertBanner alerts={sampleAlerts} onResolveAlert={onResolve} onOpenChat={onOpenChat} />);

    expect(screen.getByText(/Perlu Tindakan Penjual \(2 Peringatan Prioritas\)/)).toBeInTheDocument();
    expect(screen.getByText('JUMLAH TIDAK WAJAR')).toBeInTheDocument();
    expect(screen.getByText('PERTANYAAN ANEH / MENCURIGAKAN')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Ambil Alih Chat/ })[0]!);
    expect(onOpenChat).toHaveBeenCalledWith('hendrik_borong99', 'whatsapp');

    await user.click(screen.getAllByRole('button', { name: /Tandai Selesai & Aktifkan AI/ })[0]!);
    expect(onResolve).toHaveBeenCalledWith(101, true);
  });

  it('tidak merender apa pun jika semua alert sudah resolved', () => {
    const { container } = render(
      <SellerAlertBanner
        alerts={sampleAlerts.map((a) => ({ ...a, status: 'resolved' }))}
        onResolveAlert={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('AuthModal (Login, Registrasi Toko Baru, & Akun Demo Juri)', () => {
  it('masuk cepat akun demo memanggil /api/auth/demo dan meneruskan akun ke parent', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ success: true, account: sampleAccount }),
      })),
    );
    const onAuth = vi.fn();
    const onClose = vi.fn();

    render(<AuthModal open currentAccount={null} onClose={onClose} onAuthenticated={onAuth} />);
    await user.click(screen.getByRole('button', { name: /Masuk Cepat Akun Demo/ }));

    await waitFor(() => expect(onAuth).toHaveBeenCalledWith(sampleAccount, false));
    expect(onClose).toHaveBeenCalled();
  });

  it('pendaftaran toko baru mengirim payload ke /api/auth/register dan memicu onboarding', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        account: { ...sampleAccount, storeName: 'Berkah Aksesoris', email: 'berkah@umkm.id', onboardingCompleted: false },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const onAuth = vi.fn();
    render(<AuthModal open currentAccount={null} onClose={vi.fn()} onAuthenticated={onAuth} />);

    await user.click(screen.getByRole('radio', { name: 'Daftar Toko Baru' }));
    await user.type(screen.getByLabelText(/Nama Toko UMKM/), 'Berkah Aksesoris');
    await user.type(screen.getByLabelText(/Email Penjual/), 'berkah@umkm.id');
    await user.type(screen.getByLabelText(/Kata Sandi Baru/), 'rahasia123');
    await user.type(screen.getByLabelText(/Nomor WhatsApp Business/), '081299998888');
    await user.type(screen.getByLabelText(/Username Shopee Seller/), '@berkah.id');

    await user.click(screen.getByRole('button', { name: /Daftarkan Toko & Lanjut Koneksi Channel/ }));

    await waitFor(() =>
      expect(onAuth).toHaveBeenCalledWith(
        expect.objectContaining({ storeName: 'Berkah Aksesoris', email: 'berkah@umkm.id' }),
        true,
      ),
    );
  });
});

describe('ChannelOnboardingModal (Wizard 3 Langkah Koneksi WA Business & Shopee Seller)', () => {
  it('menjalankan langkah 1 -> 2 (memanggil jembatan izin Android) -> 3 (uji jembatan & simpan)', async () => {
    const user = userEvent.setup();
    const openSettingsSpy = vi.fn();
    (window as any).ReplyForgeAndroid = {
      isNotificationPermissionGranted: () => false,
      openNotificationSettings: openSettingsSpy,
    };

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/channels/connect')) {
        return { ok: true, json: async () => ({ account: sampleAccount }) };
      }
      return { ok: true, json: async () => ({ success: true, reply: 'Halo kak!' }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    const onSaved = vi.fn();
    render(<ChannelOnboardingModal open account={sampleAccount} onClose={vi.fn()} onSaved={onSaved} />);

    expect(screen.getByText('Perangkat Android Terdeteksi')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Lanjut ke Langkah 2: Izin Channel/ }));

    await user.click(screen.getByRole('button', { name: /Buka Pengaturan Izin Notifikasi Android/ }));
    expect(openSettingsSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Lanjut ke Langkah 3: Verifikasi/ }));
    await user.click(screen.getByRole('button', { name: /Kirim Pesan Tes Jembatan/ }));
    expect(await screen.findByText('Jembatan Terverifikasi Aktif!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Simpan & Aktifkan Koneksi Toko/ }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(sampleAccount));
  });
});

describe('LiveInboxMonitor (Kasus Normal, Alamat Belum Jelas, Borong Tidak Wajar, & Pertanyaan Aneh)', () => {
  it('memicu peringatan penjual saat pembeli memesan jumlah tidak wajar (250 pcs)', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(async () => ({
      success: true,
      escalatedToSeller: true,
      paused: true,
      anomaly: { title: 'Pesanan Jumlah Tidak Wajar (250 pcs)' },
      reason: 'Melebihi stok tersedia (25 pcs)',
    }));
    const onRefresh = vi.fn();

    render(<LiveInboxMonitor onSendMessage={onSend} isLoading={false} onRefreshData={onRefresh} />);

    await user.click(screen.getByRole('button', { name: /Jumlah Tidak Wajar/ }));
    expect(onSend).toHaveBeenCalledWith({
      buyer: 'hendrik_borong99',
      channel: 'whatsapp',
      text: 'Kak saya mau borong Griptok Bunga Daisy 250 pcs sekarang juga, bisa langsung kirim semua?',
      packageName: 'com.whatsapp.w4b',
    });
    expect(await screen.findByText(/PERINGATAN PENJUAL: Pesanan Jumlah Tidak Wajar \(250 pcs\)/)).toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalled();
  });

  it('menandai draf pesanan saat pembeli menulis alamat "kayak biasa"', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(async () => ({
      success: true,
      reply: 'Mohon konfirmasi alamat lengkap pengirimannya ya kak',
      order: { status: 'perlu konfirmasi alamat' },
    }));

    render(<LiveInboxMonitor onSendMessage={onSend} isLoading={false} onRefreshData={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Alamat Belum Jelas/ }));
    expect(await screen.findByText('DRAF DITANDAI: ALAMAT BELUM JELAS')).toBeInTheDocument();
  });

  it('menampilkan Kotak Masuk Pelanggan asli dan mengizinkan penjual membalas manual', async () => {
    const user = userEvent.setup();
    render(<LiveInboxMonitor onSendMessage={vi.fn()} isLoading={false} onRefreshData={vi.fn()} />);

    expect(screen.getByText(/Kotak Masuk Pelanggan/)).toBeInTheDocument();
    const replyInput = screen.getByLabelText('Balas manual ke pembeli');
    await user.type(replyInput, 'Siap kak Siti, kami kemas sekarang ya!{Enter}');
    expect(await screen.findByText('Siap kak Siti, kami kemas sekarang ya!')).toBeInTheDocument();
  });
});

describe('TutorialModal (Panduan Cara Pakai Interaktif)', () => {
  it('menampilkan 4 tab panduan langkah demi langkah untuk pemula', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TutorialModal open onClose={onClose} />);

    expect(screen.getByText('Panduan Cara Pakai ReplyForge')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '2. Fungsi Tiap Menu' }));
    expect(screen.getByText('1. Kotak Masuk & Chat')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '3. Kapan AI Panggil Anda?' }));
    expect(screen.getByText(/Kondisi Anomali: Jumlah Tidak Wajar/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '4. Cara Pakai di HP' }));
    await user.click(screen.getByRole('button', { name: 'Mengerti, Mulai Gunakan Aplikasi' }));
    expect(onClose).toHaveBeenCalled();
  });
});
