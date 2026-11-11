export interface Product {
  id: number;
  sku: string;
  name: string;
  aliases: string[];
  unit: string;
  price: number;
  hpp: number;
  stock: number;
  capacity: number;
  max_order_normal?: number;
  updated_at: number;
}

export interface BuyerIntentSession {
  id: number;
  buyer: string;
  channel: string;
  sku: string;
  product_name: string;
  quantity: number;
  total_price: number;
  status: 'inquiry' | 'ordered' | 'paid';
  last_message: string;
  created_at: number;
  updated_at: number;
}

export interface Rule {
  id: number;
  name: string;
  triggers: string[];
  response: string;
  enabled: boolean;
  source: string;
}

export interface Order {
  id: number;
  code: string;
  buyer: string;
  channel: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  total: number;
  status: string;
  source: string;
  missing_fields?: string[];
  address_note?: string;
  created_at: number;
}

export interface AnomalyAlert {
  id: number;
  thread_id: string;
  buyer: string;
  channel: string;
  kind: 'UNUSUAL_QUANTITY' | 'WEIRD_QUERY' | 'INCOMPLETE_ORDER' | string;
  severity: 'high' | 'medium' | 'low' | string;
  title: string;
  reason: string;
  message_text: string;
  requested_qty: number;
  sku: string | null;
  status: 'open' | 'resolved' | string;
  created_at: number;
}

export interface StoreAccount {
  id?: number;
  email: string;
  phone: string;
  ownerName: string;
  storeName: string;
  category: string;
  shopeeHandle: string;
  whatsappNumber: string;
  bankAccount: string;
  shopeeConnected: boolean;
  whatsappConnected: boolean;
  osNotificationGranted: boolean;
  onboardingCompleted: boolean;
}

export interface TelemetryNode {
  node: 1 | 2 | 3 | 4;
  name: string;
  status: string;
  badge?: string;
  channel?: string;
  buyer?: string;
  preview?: string;
  engine?: string;
  latencyMs?: number;
  color?: string;
  delayMs?: number;
  timestamp: number;
}

export interface Metrics {
  messages: number;
  llmCalls: number;
  localEngine: number;
  cacheHits: number;
  tokensSaved: number;
  blocked: number;
  redactions: number;
  ordersFromChat: number;
  mergedFragments: number;
  selfLoopsBlocked: number;
  anomaliesDetected?: number;
  carbonSavedGrams: string;
  cacheHitRatio: string;
}

export interface Settings {
  storeName: string;
  ownerName?: string;
  email?: string;
  shopeeHandle?: string;
  whatsappNumber?: string;
  shopeeConnected?: boolean;
  whatsappConnected?: boolean;
  osNotificationGranted?: boolean;
  onboardingCompleted?: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  engine: 'auto' | 'gateway' | 'local';
  mode: 'autopilot' | 'copilot';
  tone: 'santai' | 'formal';
  cutoff: string;
  typingDelayMs: number;
  debounceMs: number;
  carbonPerKTokens: number;
  blockGroups: boolean;
  whitelist: Record<string, boolean>;
  bankAccount: string;
}

export interface CacheEntry {
  id: number;
  intent: string;
  skus: string[];
  tokens: string[];
  question: string;
  template: string;
  hits: number;
  last_hit: number | null;
}

export interface PrivacyLog {
  id: number;
  kind: string;
  package: string;
  preview: string;
  created_at: number;
}
