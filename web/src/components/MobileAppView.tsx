import React, { useState } from 'react';
import { MessageSquare, Package, Receipt, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AnomalyAlert, Metrics, Order, PrivacyLog, Product, Rule, Settings } from '../types';
import { SellerAlertBanner } from './SellerAlertBanner';
import { AppHeader } from './mobile/AppHeader';
import { BottomNav, type NavItem, type TabId } from './mobile/BottomNav';
import { InboxView } from './mobile/InboxView';
import { OrdersTab } from './mobile/OrdersTab';
import { StockTab } from './mobile/StockTab';
import { SystemTab } from './mobile/SystemTab';
import { ThreadView } from './mobile/ThreadView';
import { getOrderState, isShippable } from './mobile/orderState';
import { useChatThreads } from './mobile/useChatThreads';
import { useGatewayModels } from './mobile/useGatewayModels';
import { useStockComposer } from './mobile/useStockComposer';

interface Props {
  products: Product[];
  rules: Rule[];
  orders: Order[];
  settings: Settings;
  metrics: Metrics;
  privacyLogs: PrivacyLog[];
  alerts?: AnomalyAlert[];
  onResolveAlert?: (id: number, resumeAi: boolean) => void;
  onOpenConnectWizard?: () => void;
  onOpenAuthModal?: () => void;
  onOpenTutorial?: () => void;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onAdjustStock: (sku: string, delta: number) => void;
  onUpdateOrderStatus?: (id: number, status: 'reserved' | 'paid' | 'cancelled') => void;
  onAddRule: (rule: Omit<Rule, 'id' | 'source'>) => void;
  onRunConversationalCommand: (cmd: string) => Promise<string>;
  onRefreshData: () => void;
}

/**
 * Aplikasi mobile ReplyForge (dimuat di WebView Android lewat `?mobile=1`).
 * File ini hanya shell: state tab + wiring. Tampilan tiap tab ada di ./mobile/*.
 */
export const MobileAppView: React.FC<Props> = ({
  products,
  rules,
  orders,
  settings,
  metrics,
  privacyLogs,
  alerts = [],
  onResolveAlert,
  onOpenConnectWizard,
  onOpenAuthModal,
  onOpenTutorial,
  onUpdateSettings,
  onAdjustStock,
  onUpdateOrderStatus,
  onAddRule,
  onRunConversationalCommand,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const chat = useChatThreads();
  const composer = useStockComposer({ onRunConversationalCommand, onRefreshData });
  const gateway = useGatewayModels();

  const isAutoPilot = settings.mode === 'autopilot';

  const toggleMode = () => {
    onUpdateSettings({ mode: isAutoPilot ? 'copilot' : 'autopilot' });
    toast.info(isAutoPilot ? 'Mode 1-Tap Copilot: Anda menyetujui tiap balasan AI.' : 'Auto-Pilot aktif: AI membalas otomatis.');
  };

  const shippableOrders = orders.filter((o) => isShippable(getOrderState(o.status))).length;
  const navItems: NavItem[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: chat.unreadTotal },
    { id: 'stock', label: 'Stok & AI', icon: Package },
    { id: 'orders', label: 'Transaksi', icon: Receipt, badge: shippableOrders },
    { id: 'system', label: 'Sistem', icon: SettingsIcon },
  ];

  const openThread = activeTab === 'chat' ? chat.activeThread : null;

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-app font-sans text-ink-1 lg:h-[812px] lg:max-h-[812px]">
      {openThread ? (
        <ThreadView
          key={openThread.id}
          thread={openThread}
          orders={orders}
          takeover={chat.isTakeover(openThread.id)}
          isAutoPilot={isAutoPilot}
          onBack={chat.close}
          onSend={(text) => chat.sendAdminMessage(openThread.id, text)}
          onSetTakeover={(next) => chat.setTakeover(openThread.id, next)}
          onUpdateOrderStatus={onUpdateOrderStatus}
        />
      ) : (
        <>
          <AppHeader
            isAutoPilot={isAutoPilot}
            onToggleMode={toggleMode}
            storeName={settings.storeName || 'Stickeria'}
            onOpenConnectWizard={onOpenConnectWizard}
            onOpenTutorial={onOpenTutorial}
          />

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {alerts.length > 0 && onResolveAlert && (
              <SellerAlertBanner alerts={alerts} onResolveAlert={onResolveAlert} compact />
            )}
            <div key={activeTab} className="animate-fade-in">
              {activeTab === 'chat' && <InboxView chat={chat} isAutoPilot={isAutoPilot} />}
              {activeTab === 'stock' && (
                <StockTab
                  products={products}
                  rules={rules}
                  composer={composer}
                  onAdjustStock={onAdjustStock}
                  onAddRule={onAddRule}
                  onRefresh={onRefreshData}
                />
              )}
              {activeTab === 'orders' && (
                <OrdersTab
                  orders={orders}
                  onAdjustStock={onAdjustStock}
                  onRefresh={onRefreshData}
                  onUpdateOrderStatus={onUpdateOrderStatus}
                />
              )}
              {activeTab === 'system' && (
                <SystemTab
                  settings={settings}
                  metrics={metrics}
                  privacyLogs={privacyLogs}
                  gateway={gateway}
                  onUpdateSettings={onUpdateSettings}
                  onOpenConnectWizard={onOpenConnectWizard}
                  onOpenAuthModal={onOpenAuthModal}
                />
              )}
            </div>
          </main>

          <BottomNav items={navItems} active={activeTab} onChange={setActiveTab} />
        </>
      )}
    </div>
  );
};
