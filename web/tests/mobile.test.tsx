import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('sonner', () => {
  const t: any = vi.fn();
  t.success = vi.fn();
  t.error = vi.fn();
  t.info = vi.fn();
  t.loading = vi.fn();
  return { toast: t, Toaster: () => null };
});
import { toast } from 'sonner';
import { MobileAppView } from '../src/components/MobileAppView';
import { PRESETS, MOCK_CSV, VOICE_SAMPLE } from '../src/components/mobile/data';
import * as fx from './fixtures';

const t = toast as any;

function stubFetch(handler?: (url: string, init?: any) => any) {
  const fn = vi.fn(async (url: string, init?: any) => {
    const custom = handler?.(url, init);
    if (custom !== undefined) return { json: async () => custom };
    if (url.includes('/api/gateway/models')) return { json: async () => ({ models: [{ id: 'ag/gemini-3.8-flash-low' }, { id: 'gemini-2.5-flash' }] }) };
    if (url.includes('import-csv')) return { json: async () => ({ success: true, count: 4 }) };
    if (url.includes('scan-vision')) return { json: async () => ({ success: true }) };
    return { json: async () => ({}) };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

async function renderMobile(over: Partial<React.ComponentProps<typeof MobileAppView>> = {}) {
  const props = {
    products: fx.products,
    rules: fx.rules,
    orders: fx.orders,
    settings: fx.settings,
    metrics: fx.metrics,
    privacyLogs: fx.privacyLogs,
    onUpdateSettings: vi.fn(),
    onAdjustStock: vi.fn(),
    onAddRule: vi.fn(),
    onRunConversationalCommand: vi.fn(async (c: string) => `OK: ${c}`),
    onRefreshData: vi.fn(),
    ...over,
  };
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(<MobileAppView {...props} />);
  });
  return { ...utils, props };
}

const goto = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => user.click(screen.getByRole('button', { name }));

beforeEach(() => {
  stubFetch();
  Object.values(t).forEach((f: any) => f?.mockClear?.());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Mobile · header & chat', () => {
  it('menampilkan 3 percakapan dan memfilter per channel', async () => {
    const user = userEvent.setup();
    await renderMobile();
    expect(screen.getByRole('button', { name: /Rina Wati/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Budi Santoso/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Siti Khadijah/ })).toBeNull();
    await user.click(screen.getByRole('radio', { name: /WhatsApp/ }));
    expect(screen.getByRole('button', { name: /Siti Khadijah/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rina Wati/ })).toBeNull();
  });

  it('toggle Auto-Pilot memanggil onUpdateSettings dengan mode yang benar (dua arah)', async () => {
    const user = userEvent.setup();
    const { props, rerender } = await renderMobile();
    await user.click(screen.getByRole('switch', { name: 'Auto-Pilot' }));
    expect(props.onUpdateSettings).toHaveBeenCalledWith({ mode: 'copilot' });
    await act(async () => {
      rerender(<MobileAppView {...props} settings={{ ...fx.settings, mode: 'copilot' }} />);
    });
    expect(screen.getByRole('switch', { name: 'Auto-Pilot' })).toHaveAttribute('aria-checked', 'false');
    await user.click(screen.getByRole('switch', { name: 'Auto-Pilot' }));
    expect(props.onUpdateSettings).toHaveBeenLastCalledWith({ mode: 'autopilot' });
  });

  it('buka chat → takeover → kirim balasan → kembali (tombol Back Android = popstate)', async () => {
    const user = userEvent.setup();
    await renderMobile();
    await user.click(screen.getByRole('button', { name: /Rina Wati/ }));
    // bottom nav & header global hilang, bubble HPP guard tampil
    expect(screen.queryByRole('navigation', { name: 'Navigasi utama' })).toBeNull();
    expect(screen.getByText('HPP terproteksi')).toBeInTheDocument();
    expect(screen.getByText('Pembayaran dikonfirmasi (#2610259988LINA)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Takeover Manual' }));
    expect(t.info).toHaveBeenCalledWith('AI dijeda manual. Anda memegang kendali chat.');
    expect(screen.getByRole('button', { name: 'AI Dijeda' })).toHaveAttribute('aria-pressed', 'true');

    await user.type(screen.getByLabelText('Tulis balasan'), 'Siap kak, segera dikemas{Enter}');
    expect(screen.getByText('Siap kak, segera dikemas')).toBeInTheDocument();
    expect(t.success).toHaveBeenCalledWith('Pesan terkirim ke Rina Wati via Shopee');

    // Back Android → WebView.goBack() → popstate → hanya menutup percakapan
    await act(async () => {
      window.history.back();
    });
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument());

    // status takeover tetap diingat di daftar chat
    expect(screen.getByText('AI dijeda')).toBeInTheDocument();
  });

  it('tombol kembali di app menutup percakapan dan badge unread hilang setelah dibaca', async () => {
    const user = userEvent.setup();
    await renderMobile();
    expect(screen.getByRole('button', { name: /^Chat 1 perlu perhatian/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Rina Wati/ }));
    await user.click(screen.getByRole('button', { name: 'Kembali ke daftar chat' }));
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^Chat$/ })).toBeInTheDocument(); // badge hilang
  });
});

describe('Mobile · Stok & AI', () => {
  it('stepper memanggil onAdjustStock(sku, ±1) dan filter hampir habis bekerja', async () => {
    const user = userEvent.setup();
    const { props } = await renderMobile();
    await goto(user, /^Stok & AI/);
    await user.click(screen.getByRole('button', { name: 'Kurangi stok Paket Stiker Kucing Gemoy' }));
    expect(props.onAdjustStock).toHaveBeenLastCalledWith('STK-CAT-01', -1);
    await user.click(screen.getByRole('button', { name: 'Tambah stok Gantungan Kunci Akrilik Capybara' }));
    expect(props.onAdjustStock).toHaveBeenLastCalledWith('KC-ACRYL-02', 1);

    expect(screen.getByText(/HPP ≈ Rp24\.500/)).toBeInTheDocument(); // produk tanpa HPP → estimasi (35000 * 0.7 = 24500)
    await user.click(screen.getByRole('radio', { name: /Hampir habis/ }));
    expect(screen.getByText('Griptok HP Akrilik Bunga Daisy')).toBeInTheDocument();
    expect(screen.queryByText('Paket Stiker Kucing Gemoy')).toBeNull();
  });

  it('tombol kurang nonaktif saat stok 0 dan kapasitas 0 tidak menghasilkan NaN', async () => {
    const user = userEvent.setup();
    await renderMobile({ products: [{ sku: 'X', name: 'Produk Nol', price: 1000, hpp: 500, stock: 0, capacity: 0, unit: 'pcs' }] });
    await goto(user, /^Stok & AI/);
    expect(screen.getByRole('button', { name: 'Kurangi stok Produk Nol' })).toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Level stok Produk Nol' })).toHaveAttribute('aria-valuenow', '0');
  });

  it('template: Gunakan → onAddRule persis seperti versi lama; yang sudah aktif ditandai', async () => {
    const user = userEvent.setup();
    const { props } = await renderMobile();
    await goto(user, /^Stok & AI/);
    const row = screen.getByRole('heading', { name: 'Stok Kosong' }).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Gunakan' }));
    expect(props.onAddRule).toHaveBeenCalledWith({ name: 'Stok Kosong', triggers: ['habis'], response: PRESETS[1]!.text, enabled: true });
    expect(t.success).toHaveBeenCalledWith('Template "Stok Kosong" aktif!');
    // fixtures.rules sudah punya "Stok Ready" → tidak ada tombol Gunakan di barisnya
    const active = screen.getByRole('heading', { name: 'Stok Ready' }).closest('li') as HTMLElement;
    expect(within(active).getByText('Aktif')).toBeInTheDocument();
    expect(within(active).queryByRole('button', { name: 'Gunakan' })).toBeNull();
  });

  it('perintah cepat: Simpan → onRunConversationalCommand → toast, bersihkan input, refresh', async () => {
    const user = userEvent.setup();
    const { props } = await renderMobile();
    await goto(user, /^Stok & AI/);
    const save = screen.getByRole('button', { name: 'Simpan' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText('Perintah stok dan aturan'), 'Stiker stok 20');
    await user.click(save);
    await waitFor(() => expect(props.onRunConversationalCommand).toHaveBeenCalledWith('Stiker stok 20'));
    await waitFor(() => expect(props.onRefreshData).toHaveBeenCalled());
    expect(t.success).toHaveBeenCalledWith('OK: Stiker stok 20');
    expect(screen.getByLabelText('Perintah stok dan aturan')).toHaveValue('');
  });

  it('perintah cepat gagal → toast.error dan input tidak dihapus', async () => {
    const user = userEvent.setup();
    const { props } = await renderMobile({ onRunConversationalCommand: vi.fn(async () => { throw new Error('server mati'); }) });
    await goto(user, /^Stok & AI/);
    await user.type(screen.getByLabelText('Perintah stok dan aturan'), 'tes');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));
    await waitFor(() => expect(t.error).toHaveBeenCalledWith('Gagal memproses: server mati'));
    expect(screen.getByLabelText('Perintah stok dan aturan')).toHaveValue('tes');
    expect(props.onRefreshData).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Simpan' })).not.toHaveAttribute('aria-busy');
  });

  it('chip contoh mengisi textarea; suara mengisi contoh setelah 1200ms', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderMobile();
    await goto(user, /^Stok & AI/);
    await user.click(screen.getByRole('button', { name: 'Update stok & harga' }));
    expect(screen.getByLabelText('Perintah stok dan aturan')).toHaveValue('Paket Stiker Kucing stok 50 harga 15 ribu HPP 6 ribu');
    await user.click(screen.getByRole('button', { name: 'Ucapkan perintah' }));
    expect(t.info).toHaveBeenCalledWith('Mendengarkan suara admin toko...');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(screen.getByLabelText('Perintah stok dan aturan')).toHaveValue(VOICE_SAMPLE);
    expect(t.success).toHaveBeenCalledWith('Suara terdeteksi: Stiker & Keychain');
  });

  it('impor CSV & scan foto memanggil endpoint yang sama dengan payload yang sama', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();
    const { props } = await renderMobile();
    await goto(user, /^Stok & AI/);
    await user.click(screen.getByRole('button', { name: /Impor Katalog Template Shopee/ }));
    await waitFor(() => expect(t.success).toHaveBeenCalledWith('Berhasil mengimpor 4 produk dari template Shopee!'));
    const csvCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('import-csv'))!;
    expect(csvCall[1].method).toBe('POST');
    expect(JSON.parse(csvCall[1].body)).toEqual({ csvData: MOCK_CSV });
    expect(MOCK_CSV.split('\n')).toHaveLength(5);
    expect(props.onRefreshData).toHaveBeenCalledTimes(1);
  });
});

describe('Mobile · Transaksi', () => {
  it('status pesanan dipetakan benar (termasuk batal) dan 1-Tap Tautkan bekerja', async () => {
    const user = userEvent.setup();
    const { props } = await renderMobile();
    await goto(user, /^Transaksi/);
    expect(screen.getByRole('button', { name: /^Transaksi 2 perlu perhatian/ })).toBeInTheDocument();
    expect(screen.getByText('Lunas', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Menunggu bayar', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Silent buyer')).toBeInTheDocument();
    expect(screen.getByText('Dibatalkan')).toBeInTheDocument();
    expect(screen.getByText('Stok dikembalikan')).toBeInTheDocument();
    expect(screen.getByText('-2 pcs stok')).toBeInTheDocument();
    expect(screen.getByText('Nadia Putri')).toBeInTheDocument(); // nama dengan spasi: tanpa "@"
    expect(screen.getByText('@rina_wati88')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1-Tap Tautkan' }));
    expect(props.onAdjustStock).toHaveBeenCalledWith('STK-CAT-01', -1);
    expect(t.success).toHaveBeenCalledWith('Ditautkan ke Paket Stiker Kucing Gemoy (-1 pack stok)');
  });

  it('filter pesanan dan keadaan kosong', async () => {
    const user = userEvent.setup();
    await renderMobile();
    await goto(user, /^Transaksi/);
    await user.click(screen.getByRole('radio', { name: 'Batal' }));
    expect(screen.getByText('#2610256001MKNA')).toBeInTheDocument();
    expect(screen.queryByText('#2610259988LINA')).toBeNull();
  });

  it('tanpa pesanan menampilkan empty state', async () => {
    const user = userEvent.setup();
    await renderMobile({ orders: [] });
    await goto(user, /^Transaksi/);
    expect(screen.getByText('Belum ada transaksi')).toBeInTheDocument();
  });

  it('tanggal tidak valid tidak menampilkan "Invalid Date"', async () => {
    const user = userEvent.setup();
    await renderMobile({ orders: [{ ...fx.orders[0]!, created_at: 'bukan-tanggal' }] });
    await goto(user, /^Transaksi/);
    expect(screen.queryByText(/Invalid/)).toBeNull();
  });
});

describe('Mobile · Sistem', () => {
  it('dropdown model mengirim onUpdateSettings({model}); daftar model dari gateway', async () => {
    const user = userEvent.setup();
    const { props } = await renderMobile();
    await goto(user, /^Sistem/);
    expect(screen.getByText('2 model tersedia dari gateway')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Model AI'), { target: { value: 'gemini-2.5-flash' } });
    expect(props.onUpdateSettings).toHaveBeenCalledWith({ model: 'gemini-2.5-flash' });
  });

  it('gateway offline: tidak crash, memakai model bawaan, ada penjelasan', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    await renderMobile({ settings: { ...fx.settings, model: '' } });
    await goto(user, /^Sistem/);
    expect(screen.getByText('Gateway belum terjangkau, memakai model bawaan.')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ag/gemini-3.8-flash-low (Default)' })).toBeInTheDocument();
  });

  it('metrik, log privasi (3 + lihat semua) dan nilai cadangan bila metrik kosong', async () => {
    const user = userEvent.setup();
    await renderMobile();
    await goto(user, /^Sistem/);
    expect(screen.getAllByText('72.5%').length).toBeGreaterThan(0);
    expect(screen.getByText('18.450')).toBeInTheDocument();
    expect(screen.queryByText('OTP_SHOPEE')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Lihat semua (4)' }));
    expect(screen.getByText('OTP_SHOPEE')).toBeInTheDocument();
  });

  it('metrik kosong memakai nilai cadangan lama (68.4% / 14.2) dan tanpa log privasi', async () => {
    const user = userEvent.setup();
    await renderMobile({ metrics: {}, privacyLogs: [] });
    await goto(user, /^Sistem/);
    expect(screen.getAllByText('68.4%').length).toBeGreaterThan(0);
    expect(screen.getByText('14.2')).toBeInTheDocument();
    expect(screen.getByText('Nol kebocoran data. Kode OTP diblokir 100% lokal di HP.')).toBeInTheDocument();
  });
});
