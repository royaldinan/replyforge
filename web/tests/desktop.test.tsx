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
import { BuyerSimulator } from '../src/components/BuyerSimulator';
import { GreenPrivacyGateway } from '../src/components/GreenPrivacyGateway';
import { InventoryBarometer } from '../src/components/InventoryBarometer';
import { MiroFishSimulator } from '../src/components/MiroFishSimulator';
import { OrderLedger } from '../src/components/OrderLedger';
import { StoreStudio } from '../src/components/StoreStudio';
import { TelemetryPipeline } from '../src/components/TelemetryPipeline';
import * as fx from './fixtures';

const t = toast as any;
beforeEach(() => Object.values(t).forEach((f: any) => f?.mockClear?.()));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ */
describe('TelemetryPipeline', () => {
  it('tanpa node aktif: semua idle, ringkasan dari history', () => {
    render(<TelemetryPipeline activeNode={null} history={fx.telemetryHistory} />);
    expect(document.querySelector('[aria-current="step"]')).toBeNull();
    expect(screen.getByText('Event tercatat').nextSibling).toHaveTextContent('4'); // dt dulu, dd setelahnya
  });

  it('node diblokir ditandai aktif; node sebelumnya "done"; latensi tampil', () => {
    render(<TelemetryPipeline activeNode={{ node: 2, status: 'BLOCK OTP', latencyMs: 1, badge: 'OTP BCA diblokir lokal' }} history={[]} />);
    const active = document.querySelector('[aria-current="step"]') as HTMLElement;
    expect(within(active).getByText('Filter privasi & cache')).toBeInTheDocument();
    expect(within(active).getByText('OTP BCA diblokir lokal')).toBeInTheDocument();
    expect(within(active).getByText('1ms')).toBeInTheDocument();
    expect(screen.getByText('Rata-rata latensi').parentElement).toHaveTextContent('-'); // history kosong → tanda minus, bukan NaN
  });

  it('status CACHE & status biasa tanpa latensi → "AKTIF"', () => {
    const { rerender } = render(<TelemetryPipeline activeNode={{ node: 2, status: 'CACHE HIT', latencyMs: 0 }} history={[]} />);
    expect(screen.getByText('0ms')).toBeInTheDocument();
    rerender(<TelemetryPipeline activeNode={{ node: 3, status: 'AI' }} history={[]} />);
    expect(screen.getByText('AKTIF')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
describe('BuyerSimulator', () => {
  it('skenario 5 mengirim payload persis seperti versi lama dan menampilkan balasan', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn(async () => ({ reply: 'Notifikasi diblokir lokal.' }));
    render(<BuyerSimulator onSendMessage={onSendMessage} isLoading={false} />);
    await user.click(screen.getByRole('button', { name: /Skenario 5/ }));
    expect(onSendMessage).toHaveBeenCalledWith({
      buyer: 'Budi Santoso',
      channel: 'shopee',
      text: 'Kode OTP BCA Anda 849201. JANGAN BERIKAN KEPADA SIAPA PUN termasuk pihak bank.',
      packageName: 'com.shopee.id',
    });
    expect(await screen.findByText('Notifikasi diblokir lokal.')).toBeInTheDocument();
  });

  it('channel WhatsApp memakai package WA; Enter mengirim pesan bebas dan mengosongkan input', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn(async () => ({ reply: 'ok' }));
    render(<BuyerSimulator onSendMessage={onSendMessage} isLoading={false} />);
    await user.click(screen.getByRole('radio', { name: 'WhatsApp Business' }));
    await user.type(screen.getByLabelText('Pesan pembeli'), 'halo kak{Enter}');
    expect(onSendMessage).toHaveBeenCalledWith({ buyer: 'Budi Santoso', channel: 'whatsapp', text: 'halo kak', packageName: 'com.whatsapp.w4b' });
    await screen.findByText('ok');
    expect(screen.getByLabelText('Pesan pembeli')).toHaveValue('');
  });

  it('saat loading semua tombol skenario nonaktif dan indikator tampil', () => {
    render(<BuyerSimulator onSendMessage={vi.fn()} isLoading />);
    screen.getAllByRole('button', { name: /Skenario/ }).forEach((b) => expect(b).toBeDisabled());
    expect(screen.getByText('ReplyForge agent sedang memproses...')).toBeInTheDocument();
  });

  it('balasan kosong (res tanpa reply) tidak membuat crash', async () => {
    const user = userEvent.setup();
    render(<BuyerSimulator onSendMessage={vi.fn(async () => undefined)} isLoading={false} />);
    await user.click(screen.getByRole('button', { name: /Skenario 1/ }));
    expect(screen.getAllByText(/Paket Stiker Kucing Gemoy masih ready/).length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
describe('InventoryBarometer', () => {
  const setup = (mode: 'autopilot' | 'copilot' = 'autopilot', products = fx.products) => {
    const props = { products, settings: { ...fx.settings, mode }, onUpdateSettings: vi.fn(), onAdjustStock: vi.fn() };
    render(<InventoryBarometer {...props} />);
    return props;
  };

  it('segmented mode memanggil onUpdateSettings hanya saat berubah', async () => {
    const user = userEvent.setup();
    const p = setup('autopilot');
    await user.click(screen.getByRole('radio', { name: 'Auto-Pilot' }));
    expect(p.onUpdateSettings).not.toHaveBeenCalled();
    await user.click(screen.getByRole('radio', { name: '1-Tap Copilot' }));
    expect(p.onUpdateSettings).toHaveBeenCalledWith({ mode: 'copilot' });
  });

  it('copilot → autopilot', async () => {
    const user = userEvent.setup();
    const p = setup('copilot');
    await user.click(screen.getByRole('radio', { name: 'Auto-Pilot' }));
    expect(p.onUpdateSettings).toHaveBeenCalledWith({ mode: 'autopilot' });
  });

  it('stepper memanggil onAdjustStock; stok rendah diberi badge; stok 0 menonaktifkan tombol kurang', async () => {
    const user = userEvent.setup();
    const p = setup('autopilot', [...fx.products, { sku: 'Z', name: 'Habis', price: 5000, hpp: 1, stock: 0, capacity: 10, unit: 'pcs' }]);
    await user.click(screen.getByRole('button', { name: 'Kurangi stok Paket Stiker Kucing Gemoy' }));
    expect(p.onAdjustStock).toHaveBeenLastCalledWith('STK-CAT-01', -1);
    await user.click(screen.getByRole('button', { name: 'Tambah stok Habis' }));
    expect(p.onAdjustStock).toHaveBeenLastCalledWith('Z', 1);
    expect(screen.getByRole('button', { name: 'Kurangi stok Habis' })).toBeDisabled();
    expect(screen.getAllByText('Hampir habis')).toHaveLength(2); // Griptok (4) + Habis (0)
  });
});

/* ------------------------------------------------------------------ */
describe('StoreStudio', () => {
  const setup = (over: Partial<React.ComponentProps<typeof StoreStudio>> = {}) => {
    const props = {
      rules: fx.rules,
      products: fx.products,
      settings: fx.settings,
      onAddRule: vi.fn(),
      onDeleteRule: vi.fn(),
      onRunConversationalCommand: vi.fn(async (c: string) => `Selesai: ${c}`),
      ...over,
    };
    render(<StoreStudio {...props} />);
    return props;
  };

  it('perintah santai: Enter menjalankan, menampilkan hasil, mengosongkan input', async () => {
    const user = userEvent.setup();
    const p = setup();
    await user.type(screen.getByLabelText('Perintah untuk asisten toko'), 'stok stiker 10{Enter}');
    expect(p.onRunConversationalCommand).toHaveBeenCalledWith('stok stiker 10');
    expect(await screen.findByText('Selesai: stok stiker 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Perintah untuk asisten toko')).toHaveValue('');
  });

  it('perintah gagal: tampil "Error: …" bergaya error dan input dipertahankan', async () => {
    const user = userEvent.setup();
    setup({ onRunConversationalCommand: vi.fn(async () => { throw new Error('boom'); }) });
    await user.type(screen.getByLabelText('Perintah untuk asisten toko'), 'x');
    await user.click(screen.getByRole('button', { name: 'Eksekusi' }));
    expect(await screen.findByText('Error: boom')).toBeInTheDocument();
    expect(screen.getByLabelText('Perintah untuk asisten toko')).toHaveValue('x');
  });

  it('chip contoh mengisi input; preset 1 → onAddRule persis seperti lama; hapus aturan → onDeleteRule(id)', async () => {
    const user = userEvent.setup();
    const p = setup();
    await user.click(screen.getByRole('button', { name: /Contoh 2/ }));
    expect(screen.getByLabelText('Perintah untuk asisten toko')).toHaveValue(
      'Kalau ada pembeli yang nanya pengiriman atau jam buka, langsung jawab toko buka tiap hari dan batas pengiriman jam 4 sore ya',
    );
    await user.click(screen.getAllByRole('button', { name: 'Pasang preset ini' })[0]!);
    expect(p.onAddRule).toHaveBeenCalledWith({
      name: 'Preset 1: Stok Ready & Ramah',
      triggers: ['ready', 'ada stok', 'masih ada'],
      response: 'Halo kak {nama_pembeli}! {produk} masih ready ya, sisa {stok} lagi. Harganya {harga}, mau aku siapin berapa kak?',
      enabled: true,
    });
    await user.click(screen.getByRole('button', { name: 'Hapus aturan Stok Ready' }));
    expect(p.onDeleteRule).toHaveBeenCalledWith(1);
  });

  it('sandbox: sukses menampilkan 3 persona', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ personas: [{ id: 1, name: 'Si Tawar', badge: 'NEGO', prompt: 'p', response: 'r', engine: 'e', latencyMs: 5 }] }) })));
    setup();
    await user.click(screen.getByRole('button', { name: /Jalankan 1-shot stress test/ }));
    expect(await screen.findByText('Si Tawar')).toBeInTheDocument();
    expect(screen.getByText('5ms')).toBeInTheDocument();
  });

  it('sandbox gagal: pesan error inline + toast (bukan alert() yang memblokir)', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('jaringan putus'); }));
    setup();
    await user.click(screen.getByRole('button', { name: /Jalankan 1-shot stress test/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal menjalankan sandbox: jaringan putus');
    expect(t.error).toHaveBeenCalledWith('Gagal menjalankan sandbox: jaringan putus');
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('daftar aturan kosong menampilkan empty state; trigger berupa string tetap dirender', () => {
    const { unmount } = render(
      <StoreStudio rules={[]} products={[]} settings={fx.settings} onAddRule={vi.fn()} onDeleteRule={vi.fn()} onRunConversationalCommand={vi.fn()} />,
    );
    expect(screen.getByText('Belum ada aturan aktif')).toBeInTheDocument();
    unmount();
    render(
      <StoreStudio
        rules={[{ id: 9, name: 'R', triggers: 'a, b' as any, response: 'x', enabled: true, source: 'chat' }]}
        products={[]}
        settings={fx.settings}
        onAddRule={vi.fn()}
        onDeleteRule={vi.fn()}
        onRunConversationalCommand={vi.fn()}
      />,
    );
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
describe('OrderLedger', () => {
  const setup = (orders = fx.orders) => {
    const props = { orders, products: fx.products, onUpdateOrderStatus: vi.fn(), onScanReceipt: vi.fn() };
    const utils = render(<OrderLedger {...props} />);
    return { ...props, ...utils };
  };

  it('aksi per baris sesuai status: reserved → bayar/batal; paid → batal; cancelled → tanpa aksi', async () => {
    const user = userEvent.setup();
    const p = setup();
    await user.click(screen.getByRole('button', { name: 'Tandai #2610258120KHAD sudah bayar' }));
    expect(p.onUpdateOrderStatus).toHaveBeenLastCalledWith(2, 'paid');
    await user.click(screen.getByRole('button', { name: 'Batalkan #2610259988LINA dan kembalikan stok' }));
    expect(p.onUpdateOrderStatus).toHaveBeenLastCalledWith(1, 'cancelled');
    expect(screen.queryByRole('button', { name: /#2610256001MKNA/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tandai #2610259988LINA sudah bayar' })).toBeNull();
  });

  it('ringkasan & label status dalam bahasa Indonesia', () => {
    setup();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Lunas')).toBeInTheDocument();
    expect(within(table).getByText('Menunggu bayar')).toBeInTheDocument();
    expect(within(table).getByText('Dibatalkan')).toBeInTheDocument();
    expect(screen.getByText('Total pesanan').nextSibling).toHaveTextContent('4');
  });

  it('tombol aksi memanggil onUpdateOrderStatus untuk konfirmasi lunas dan pembatalan', async () => {
    const user = userEvent.setup();
    const p = setup();
    await user.click(screen.getByRole('button', { name: /Tandai #2610258120KHAD sudah bayar/ }));
    expect(p.onUpdateOrderStatus).toHaveBeenCalledWith(2, 'paid');

    await user.click(screen.getByRole('button', { name: /Batalkan #2610259988LINA dan kembalikan stok/ }));
    expect(p.onUpdateOrderStatus).toHaveBeenCalledWith(1, 'cancelled');
  });

  it('tanpa pesanan menampilkan empty state', () => {
    setup([]);
    expect(screen.getByText('Belum ada pesanan yang masuk')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
describe('GreenPrivacyGateway', () => {
  const setup = (over: Partial<React.ComponentProps<typeof GreenPrivacyGateway>> = {}) => {
    const props = {
      metrics: fx.metrics,
      cacheEntries: fx.cacheEntries,
      privacyLogs: fx.privacyLogs,
      settings: fx.settings,
      onClearCache: vi.fn(),
      onUpdateSettings: vi.fn(),
      ...over,
    };
    render(<GreenPrivacyGateway {...props} />);
    return props;
  };

  it('preset gateway memanggil onUpdateSettings dengan nilai persis seperti versi lama', async () => {
    const user = userEvent.setup();
    const p = setup();
    await user.click(screen.getByRole('button', { name: /Preset 2: HuggingFace Gateway/ }));
    expect(p.onUpdateSettings).toHaveBeenLastCalledWith({ baseUrl: 'https://router.huggingface.co/v1', model: 'meta-llama/Llama-3.1-8B-Instruct', engine: 'gateway' });
    expect(screen.getByLabelText('9Router base URL')).toHaveValue('https://router.huggingface.co/v1');
    await user.click(screen.getByRole('button', { name: /Preset 1: Localhost 9Router/ }));
    expect(p.onUpdateSettings).toHaveBeenLastCalledWith({ baseUrl: 'http://localhost:20128/v1', model: 'gemini-2.5-flash', engine: 'auto' });
    await user.click(screen.getByRole('button', { name: /Preset 3: Smart Local Engine/ }));
    expect(p.onUpdateSettings).toHaveBeenLastCalledWith({ engine: 'local' });
  });

  it('simpan konfigurasi: mengirim url/apiKey/model dari form; notifikasi hilang setelah 2 dtk; tampil/sembunyi API key', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const p = setup();
    const url = screen.getByLabelText('9Router base URL');
    await user.clear(url);
    await user.type(url, 'http://192.168.1.5:20128/v1');
    const key = screen.getByLabelText('API key (opsional jika lokal)');
    expect(key).toHaveAttribute('type', 'password');
    await user.type(key, 'sk-123');
    await user.click(screen.getByRole('button', { name: 'Tampilkan API key' }));
    expect(key).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Simpan konfigurasi gateway' }));
    expect(p.onUpdateSettings).toHaveBeenCalledWith({ baseUrl: 'http://192.168.1.5:20128/v1', apiKey: 'sk-123', model: fx.settings.model });
    expect(screen.getByText('Pengaturan tersimpan!')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.queryByText('Pengaturan tersimpan!')).toBeNull();
  });

  it('hapus cache, metrik terformat, dan kondisi kosong', async () => {
    const user = userEvent.setup();
    const p = setup();
    expect(screen.getByText('18.450')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hapus semua cache' }));
    expect(p.onClearCache).toHaveBeenCalledTimes(1);
  });

  it('data kosong: tidak crash, tombol hapus cache nonaktif, whitelist kosong aman', () => {
    setup({ metrics: {}, cacheEntries: [], privacyLogs: [], settings: { ...fx.settings, whitelist: undefined as any } });
    expect(screen.getByRole('button', { name: 'Hapus semua cache' })).toBeDisabled();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Belum ada cache tersimpan')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
describe('MiroFishSimulator', () => {
  const setup = (send: any, isLoading = false) => {
    const onRefreshData = vi.fn();
    render(<MiroFishSimulator onSendMessage={send} isLoading={isLoading} onRefreshData={onRefreshData} />);
    return { onRefreshData };
  };

  it('skenario 1: langkah 1 mengirim payload persis lama, balasan masuk log, langkah maju', async () => {
    const user = userEvent.setup();
    const send = vi.fn(async () => ({ reply: 'Harga sudah pas ya kak 🙏' }));
    const { onRefreshData } = setup(send);
    expect(screen.getByText('Langkah 1 dari 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Step 1/ }));
    expect(send).toHaveBeenCalledWith({
      buyer: 'rina_wati88',
      channel: 'shopee',
      text: 'Halo kak, Paket Stiker Kucing Gemoy masih ready? Bisa kurang jadi 12rb gak kak?',
      packageName: 'com.shopee.id',
    });
    expect(await screen.findByText('Harga sudah pas ya kak 🙏')).toBeInTheDocument();
    expect(screen.getByText('Langkah 2 dari 3')).toBeInTheDocument();
    expect(onRefreshData).toHaveBeenCalled();
  });

  it('langkah 3: notifikasi pembayaran → selesai (lunas) → bisa diulang', async () => {
    const user = userEvent.setup();
    const send = vi.fn(async () => ({ isPaymentNotification: true, orderId: '2610259988LINA' }));
    setup(send);
    await user.click(screen.getByRole('button', { name: /Step 3/ }));
    expect(await screen.findByText('Selesai (Lunas)')).toBeInTheDocument();
    expect(screen.getByText(/Transaksi #2610259988LINA terverifikasi lunas/)).toBeInTheDocument();
    expect(t.success).toHaveBeenCalledWith('Shopee Payment #2610259988LINA: @rina_wati88 LUNAS (-2 pack Stiker Kucing)!');
    await user.click(screen.getByRole('button', { name: 'Ulangi simulasi dari awal' }));
    expect(screen.getByText('Langkah 1 dari 3')).toBeInTheDocument();
  });

  it('skenario 2 (silent buyer) mengirim notifikasi Shopee ke budi_01', async () => {
    const user = userEvent.setup();
    const send = vi.fn(async () => ({ isPaymentNotification: true }));
    setup(send);
    await user.click(screen.getByRole('button', { name: 'Picu notif Shopee' }));
    expect(send).toHaveBeenCalledWith({
      buyer: 'budi_01',
      channel: 'shopee',
      text: 'Pesanan Baru: Pembayaran untuk pesanan #2610257766SILENT dari budi_01 telah dikonfirmasi. Mohon kemas pesanan sebelum 28-10-2026.',
      packageName: 'com.shopee.id',
    });
    expect(await screen.findByText('SILENT BUYER')).toBeInTheDocument();
    expect(t.info).toHaveBeenCalledWith('Pesanan Silent Buyer Masuk: #2610257766SILENT (@budi_01)');
  });

  it('skenario 3 (swarm): urutan 5 pesan, buyer, channel & package sama persis dengan versi lama', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const send = vi.fn(async (p: any) => (p.text.includes('OTP') ? { blocked: true } : { reply: 'balasan' }));
    const { onRefreshData } = setup(send);
    await user.click(screen.getByRole('button', { name: 'Jalankan swarm test' }));
    expect(screen.getByRole('button', { name: 'Menjalankan...' })).toHaveAttribute('aria-busy', 'true');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500);
    });
    const calls = send.mock.calls.map((c: any[]) => [c[0].buyer, c[0].channel, c[0].packageName, c[0].text]);
    expect(calls).toEqual([
      ['pembeli_buru2', 'whatsapp', 'com.whatsapp.w4b', 'P'],
      ['pembeli_buru2', 'whatsapp', 'com.whatsapp.w4b', 'Kak'],
      ['pembeli_buru2', 'whatsapp', 'com.whatsapp.w4b', 'Gantungan Kunci Capybara ready kak?'],
      ['pembeli_kedua', 'whatsapp', 'com.whatsapp.w4b', 'Gantungan Kunci Capybara ready kak?'],
      ['Bank BCA', 'whatsapp', 'com.whatsapp.w4b', 'Kode OTP BCA Anda 849201. JANGAN BERIKAN KEPADA SIAPA PUN termasuk pihak bank.'],
    ]);
    expect(screen.getByText(/BLOCKED LOCALLY/)).toBeInTheDocument();
    expect(t.success).toHaveBeenCalledWith('MiroFish Swarm Stress Test Selesai (100% Lolos)!', { id: 'swarm' });
    expect(onRefreshData).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Jalankan swarm test' })).not.toHaveAttribute('aria-busy');
  });

  it('swarm yang error di tengah jalan TIDAK lagi membuat tombol macet', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let n = 0;
    const send = vi.fn(async () => {
      n += 1;
      if (n === 3) throw new Error('backend mati');
      return { reply: 'ok' };
    });
    setup(send);
    await user.click(screen.getByRole('button', { name: 'Jalankan swarm test' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(t.error).toHaveBeenCalledWith('Swarm test gagal di tengah jalan', { id: 'swarm' });
    expect(screen.getByText(/Swarm test terhenti: backend mati/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jalankan swarm test' })).toBeEnabled();
  });

  it('pesan uji coba bebas memakai buyer custom_buyer dan package sesuai channel', async () => {
    const user = userEvent.setup();
    const send = vi.fn(async () => ({ reply: 'siap' }));
    setup(send);
    await user.click(screen.getByRole('radio', { name: 'WhatsApp Business' }));
    await user.type(screen.getByLabelText('Pesan uji coba'), 'tes WA{Enter}');
    expect(send).toHaveBeenCalledWith({ buyer: 'custom_buyer', channel: 'whatsapp', text: 'tes WA', packageName: 'com.whatsapp.w4b' });
    expect(await screen.findByText('siap')).toBeInTheDocument();
  });

  it('isLoading menonaktifkan semua pemicu', () => {
    setup(vi.fn(), true);
    expect(screen.getByRole('button', { name: /Step 1/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Picu notif Shopee' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Jalankan swarm test' })).toBeDisabled();
  });

  it('kegagalan onSendMessage pada langkah simulasi dicatat di log, bukan unhandled rejection', async () => {
    const user = userEvent.setup();
    setup(vi.fn(async () => { throw new Error('putus'); }));
    await user.click(screen.getByRole('button', { name: /Step 2/ }));
    expect(await screen.findByText(/Gagal mengirim langkah simulasi: putus/)).toBeInTheDocument();
  });
});
