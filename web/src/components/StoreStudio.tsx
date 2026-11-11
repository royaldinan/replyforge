import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, MessageSquareText, Package, Play, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { toErrorMessage } from '../lib/format';
import type { Product, Rule, Settings } from '../types';
import { Badge, Button, Card, CardHeader, EmptyState, IconTile, cn, inputBase } from './ui';

interface Props {
  rules: Rule[];
  products: Product[];
  settings: Settings;
  onAddRule: (rule: Omit<Rule, 'id' | 'source'>) => void;
  onDeleteRule: (id: number) => void;
  onRunConversationalCommand: (cmd: string) => Promise<string>;
}

interface SandboxPersona {
  id: string | number;
  name: string;
  badge: string;
  prompt: string;
  response: string;
  engine: string;
  latencyMs: number;
}

interface Preset {
  id: string;
  name: string;
  triggers: string;
  response: string;
}

const PRESETS: Preset[] = [
  {
    id: 'ready',
    name: 'Preset 1: Stok Ready & Ramah',
    triggers: 'ready, ada stok, masih ada',
    response: 'Halo kak {nama_pembeli}! {produk} masih ready ya, sisa {stok} lagi. Harganya {harga}, mau aku siapin berapa kak?',
  },
  {
    id: 'habis',
    name: 'Preset 2: Stok Habis & Tawarkan PO',
    triggers: 'restock, kapan ready, habis',
    response:
      'Yah maaf banget kak {nama_pembeli}, {produk} lagi kosong. Restock biasanya 2-3 hari, mau aku kabarin duluan kalau sudah ready?',
  },
  {
    id: 'cutoff',
    name: 'Preset 3: Info Jam Cutoff Pengiriman',
    triggers: 'dikirim kapan, hari ini, resi',
    response: 'Order sebelum jam {jam_cutoff} dikirim hari ini kak {nama_pembeli}, nomor resi otomatis terupdate malam ya!',
  },
  {
    id: 'nego',
    name: 'Preset 4: Tolak Nego Sopan (Anti-Slop)',
    triggers: 'nego, kurang dikit, boleh kurang',
    response: 'Hehe maaf kak {nama_pembeli}, harga {produk} sudah pas ya. Tapi kalau ambil 5 pcs ke atas ada potongan khusus kok!',
  },
  {
    id: 'cod',
    name: 'Preset 5: Info Metode Bayar & COD',
    triggers: 'bisa cod, bayar di tempat, qris',
    response: 'Bisa banget kak! Bisa COD atau via QRIS & Transfer BCA. Mau dikirim pakai kurir apa kak?',
  },
  {
    id: 'followup',
    name: 'Preset 6: Follow Up Bukti Transfer',
    triggers: 'sudah transfer, udah bayar, bukti tf',
    response: 'Terima kasih banyak kak {nama_pembeli}! Kami verifikasi mutasinya sebentar ya, langsung kami kemas rapi hari ini!',
  },
];

const EXAMPLES = [
  {
    icon: Package,
    label: 'Contoh 1: Update stok & harga produk',
    text: 'Update stok dong: Paket Stiker Kucing stok 50 harga 15000, Gantungan Kunci Capybara stok 30 harga 25000',
  },
  {
    icon: Clock,
    label: 'Contoh 2: Buat aturan jam operasional',
    text: 'Kalau ada pembeli yang nanya pengiriman atau jam buka, langsung jawab toko buka tiap hari dan batas pengiriman jam 4 sore ya',
  },
];

const triggerList = (t: Rule['triggers']): string[] =>
  Array.isArray(t)
    ? t
    : String(t)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

export const StoreStudio: React.FC<Props> = ({ rules, onAddRule, onDeleteRule, onRunConversationalCommand }) => {
  const [commandInput, setCommandInput] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [isProcessingCmd, setIsProcessingCmd] = useState(false);

  const [sandboxResults, setSandboxResults] = useState<SandboxPersona[] | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  const handleCommandSubmit = async () => {
    if (!commandInput.trim() || isProcessingCmd) return;
    setIsProcessingCmd(true);
    setFeedback(null);
    try {
      const msg = await onRunConversationalCommand(commandInput);
      setFeedback({ ok: true, text: msg });
      setCommandInput('');
    } catch (e) {
      setFeedback({ ok: false, text: 'Error: ' + toErrorMessage(e) });
    } finally {
      setIsProcessingCmd(false);
    }
  };

  const handleRunSandbox = async () => {
    setIsSandboxRunning(true);
    setSandboxError(null);
    try {
      const res = await fetch('/api/sandbox/run', { method: 'POST' });
      const data = await res.json();
      setSandboxResults(data.personas || []);
    } catch (e) {
      const message = toErrorMessage(e);
      setSandboxError('Gagal menjalankan sandbox: ' + message);
      toast.error('Gagal menjalankan sandbox: ' + message);
    } finally {
      setIsSandboxRunning(false);
    }
  };

  const handleApplyPreset = (p: Preset) => {
    onAddRule({
      name: p.name,
      triggers: p.triggers.split(',').map((s) => s.trim()),
      response: p.response,
      enabled: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* A. Conversational Store & Rule Builder (Chat-to-Config) */}
      <Card padding="lg">
        <CardHeader
          icon={Sparkles}
          tone="indigo"
          title="Perintah santai ke toko"
          description="Ketik seperti berbicara ke asisten untuk update stok atau membuat aturan balas chat otomatis."
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            aria-label="Perintah untuk asisten toko"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
            placeholder='Contoh: "Kalau ada yang nanya pengiriman atau jam buka, jawab toko buka jam 8 sampai jam 9 malam ya"'
            className={cn(inputBase, 'h-11 flex-1 rounded-xl px-4 text-body focus:border-indigo-400/60 focus:ring-indigo-400/20')}
          />
          <Button variant="indigo" icon={Sparkles} loading={isProcessingCmd} disabled={!commandInput.trim()} onClick={handleCommandSubmit}>
            Eksekusi
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => {
            const Icon = ex.icon;
            return (
              <button
                key={ex.label}
                type="button"
                onClick={() => setCommandInput(ex.text)}
                className="interactive-tap inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-nested/60 px-3 text-xs font-medium text-ink-2 hover:border-white/15 hover:text-ink-1"
              >
                <Icon className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
                {ex.label}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            role="status"
            className={cn(
              'mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs font-medium',
              feedback.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900',
            )}
          >
            {feedback.ok ? (
              <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </Card>

      {/* C. 1-Shot Buyer Persona Sandbox (Stress Test) */}
      <Card padding="lg">
        <CardHeader
          icon={Play}
          tone="amber"
          title="Uji ketahanan aturan terhadap 3 karakter pembeli"
          description="Uji aturan toko terhadap 3 karakter pembeli sekaligus (penawar agresif, pembeli buru-buru, dan pembeli grosir)."
          action={
            <Button variant="amber" icon={Play} loading={isSandboxRunning} onClick={handleRunSandbox}>
              {isSandboxRunning ? 'Mensimulasikan 3 persona...' : 'Jalankan 1-shot stress test'}
            </Button>
          }
        />

        {sandboxError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-900">
            <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{sandboxError}</span>
          </div>
        )}

        {sandboxResults && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {sandboxResults.map((p) => (
              <div key={p.id} className="flex flex-col justify-between rounded-xl border border-line bg-nested/40 p-3.5">
                <div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-body font-semibold text-ink-1">{p.name}</span>
                    <Badge tone="amber">{p.badge}</Badge>
                  </div>
                  <p className="mb-2 rounded-lg bg-surface px-2.5 py-2 text-xs italic leading-5 text-ink-2">"{p.prompt}"</p>
                  <p className="rounded-lg border border-amber-300 bg-elevated p-2.5 text-body leading-5 text-ink-1">
                    {p.response}
                  </p>
                </div>
                <div className="mt-3 flex justify-between border-t border-line pt-2.5 font-mono text-2xs tabular-nums text-ink-3">
                  <span>Engine: {p.engine}</span>
                  <span>{p.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* B. 6 Preset Template Admin Olshop Indonesia Asli */}
      <Card padding="lg">
        <CardHeader
          icon={MessageSquareText}
          tone="emerald"
          title="6 preset template admin olshop Indonesia"
          description="Bahasa luwes khas CS Shopee/WhatsApp asli. Klik untuk memasang ke aturan toko."
        />

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col justify-between rounded-xl border border-line bg-nested/40 p-3.5 transition-colors duration-200 hover:border-amber-300"
            >
              <div>
                <h4 className="mb-1 text-body font-semibold text-ink-1">{preset.name}</h4>
                <p className="mb-2 font-mono text-2xs leading-4 text-amber-800">Trigger: {preset.triggers}</p>
                <p className="mb-3 rounded-lg bg-surface p-2.5 text-xs leading-5 text-ink-2">"{preset.response}"</p>
              </div>
              <Button size="sm" fullWidth icon={Plus} onClick={() => handleApplyPreset(preset)}>
                Pasang preset ini
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-5">
          <h4 className="mb-3 text-sm font-semibold text-ink-1">
            Aturan kustom aktif <span className="font-normal tabular-nums text-ink-3">({rules.length})</span>
          </h4>

          {rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-strong">
              <EmptyState
                icon={MessageSquareText}
                title="Belum ada aturan aktif"
                description="Pasang salah satu preset di atas atau buat aturan lewat perintah santai."
                className="py-8"
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule.id} className="flex items-start justify-between gap-4 rounded-xl border border-line bg-nested/40 p-3.5">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <IconTile icon={MessageSquareText} tone={rule.enabled === false ? 'neutral' : 'emerald'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-body font-semibold text-ink-1">{rule.name}</span>
                        <Badge>{rule.source}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {triggerList(rule.triggers).map((t) => (
                          <span key={t} className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-2xs font-medium text-amber-900">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-ink-2">{rule.response}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Hapus aturan ${rule.name}`}
                    title="Hapus aturan"
                    onClick={() => onDeleteRule(rule.id)}
                    className="interactive-tap grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};
