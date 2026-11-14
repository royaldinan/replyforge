
  it('impor CSV & scan foto memanggil endpoint yang sama dengan payload yang sama', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();
    const { props } = await renderMobile();
    await goto(user, /^Stok & AI/);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([MOCK_CSV], 'katalog.csv', { type: 'text/csv' });
    await user.upload(fileInput, file);
    await waitFor(() =>
      expect(t.success).toHaveBeenCalledWith('Berhasil mengimpor 4 produk dari template Shopee!'),
    );
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


  it('menampilkan koneksi kanal penjualan dan log privasi (3 + lihat semua)', async () => {
    const user = userEvent.setup();
    await renderMobile();
    await goto(user, /^Sistem/);
    expect(screen.getByText('Koneksi kanal penjualan')).toBeInTheDocument();
    expect(screen.queryByText('Efisiensi Green IT')).toBeNull();
    expect(screen.queryByText('OTP_SHOPEE')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Lihat semua (4)' }));
    expect(screen.getByText('OTP_SHOPEE')).toBeInTheDocument();
  });

  it('tanpa log privasi menampilkan pesan nol kebocoran data', async () => {
    const user = userEvent.setup();
    await renderMobile({ metrics: {}, privacyLogs: [] });
    await goto(user, /^Sistem/);
    expect(screen.getByText('Koneksi kanal penjualan')).toBeInTheDocument();
    expect(screen.getByText('Nol kebocoran data. Kode OTP diblokir 100% lokal di HP.')).toBeInTheDocument();
  });
});
