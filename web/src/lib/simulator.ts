/**
 * Bentuk respons yang diharapkan simulator dari `onSendMessage`.
 * Props bertipe `Promise<unknown>` agar fungsi apa pun dari App.tsx tetap diterima;
 * komponen menyempitkannya lewat `toSimulatorResponse`.
 */
export interface SimulatorResponse {
  reply?: string;
  isPaymentNotification?: boolean;
  orderId?: string | number;
  blocked?: boolean;
}

export const toSimulatorResponse = (res: unknown): SimulatorResponse =>
  res !== null && typeof res === 'object' ? (res as SimulatorResponse) : {};
