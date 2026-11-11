package id.replyforge.agent;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 100% Standalone Native Android Notification Interceptor & Autonomous AI Agent.
 * 
 * - Zero Laptop Dependency: runs completely standalone on the phone.
 * - Zero-Freeze Guard: persistent ongoing notification + WakeLock keeps CPU active.
 * - Local AI & Rule Execution: Direct HTTPS to Gemini / OpenRouter or Adaptive Local Fallback.
 * - Anti-Loop Guard: Drops self-replies and echo notifications.
 * - Client-Side OTP Shield: Blocks bank verification codes locally on-device.
 */
public class ReplyForgeNotificationService extends NotificationListenerService {

    private static final String TAG = "ReplyForgeAgent";
    private static final String CHANNEL_ID = "replyforge_agent_status";
    private static final String ALERT_CHANNEL_ID = "replyforge_anomaly_alerts";
    private static final int NOTIF_ID = 1001;

    private static final Set<String> PACKAGE_WHITELIST = new HashSet<>(Arrays.asList(
            "com.whatsapp.w4b",          // WhatsApp Business
            "com.whatsapp",              // WhatsApp Messenger
            "com.shopee.id",             // Shopee Indonesia
            "com.shopee.shopeeseller",   // Shopee Seller Centre
            "id.replyforge.agent"        // Self test
    ));

    private static final Map<String, Notification.Action> cachedActionsByBuyer = new ConcurrentHashMap<>();
    private static final Map<String, String> lastRepliedText = new ConcurrentHashMap<>();
    private static ReplyForgeNotificationService activeInstance;

    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private ReplyForgeDb db;

    @Override
    public void onCreate() {
        super.onCreate();
        activeInstance = this;
        db = ReplyForgeDb.getInstance(this);

        // Ensure standalone internal server is running
        ReplyForgeLocalServer.getInstance(this).start();

        // Show persistent service notification to protect from OEM task killer
        showPersistentNotification();
    }

    @Override
    public void onDestroy() {
        activeInstance = null;
        executor.shutdownNow();
        super.onDestroy();
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        activeInstance = this;
        Log.i(TAG, "ReplyForge Notification Listener connected successfully!");
        ReplyForgeLocalServer.getInstance(this).start();
        showPersistentNotification();
    }

    private void showPersistentNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel chan = new NotificationChannel(
                    CHANNEL_ID,
                    "Status Agen ReplyForge",
                    NotificationManager.IMPORTANCE_LOW
            );
            chan.setDescription("Menjaga layanan otomatisasi chat dan stok toko tetap aktif di latar belakang.");
            nm.createNotificationChannel(chan);

            NotificationChannel alertChan = new NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "Peringatan Penjual ReplyForge",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChan.setDescription("Notifikasi peringatan jika ada pesanan tidak wajar atau pertanyaan mencurigakan.");
            alertChan.enableVibration(true);
            nm.createNotificationChannel(alertChan);
        }

        Notification notif = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_chat)
                .setContentTitle("ReplyForge Aktif")
                .setContentText("Menjaga Auto-Reply WhatsApp & Shopee (Lina Shop)")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        nm.notify(NOTIF_ID, notif);
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();
        if (!PACKAGE_WHITELIST.contains(packageName)) return;

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        // Ignore Android group summaries ("2 messages from 2 chats")
        if ((notification.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;

        Bundle extras = notification.extras;
        if (extras == null) return;

        // Ignore group conversations
        boolean isGroup = extras.getBoolean(Notification.EXTRA_IS_GROUP_CONVERSATION, false);
        if (isGroup) return;

        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleCs != null ? titleCs.toString() : "Customer";
        String text = bigTextCs != null ? bigTextCs.toString() : (textCs != null ? textCs.toString() : "");

        if (text.trim().isEmpty()) return;

        // Guard 1: Strict Self-Echo & System Notification Filter
        String titleLower = title.toLowerCase().trim();
        if (titleLower.equals("anda") || titleLower.equals("you") || titleLower.equals("whatsapp") ||
            titleLower.contains("lina shop") || titleLower.contains("mahiru") ||
            text.toLowerCase().contains("memeriksa pesan baru")) {
            return;
        }

        // Guard 2: Ignore self-echo when WhatsApp updates notification after RemoteInput reply
        String cleanText = text.trim();
        if (cleanText.startsWith("Anda:") || cleanText.startsWith("You:") || cleanText.startsWith("Lina Shop:")) {
            return;
        }
        String lastSent = lastRepliedText.get(titleLower);
        if (lastSent != null && cleanText.equalsIgnoreCase(lastSent.trim())) {
            return;
        }

        // Guard 3: Local OTP Pre-check (0 Bytes to AI)
        if (isOtpPattern(text)) {
            Log.w(TAG, "OTP Shield: Sensitive verification code dropped on-device.");
            return;
        }

        // Cache RemoteInput quick-reply action
        Notification.Action replyAction = findQuickReplyAction(notification);
        if (replyAction != null) {
            cachedActionsByBuyer.put(titleLower, replyAction);
        }

        String channel = packageName.contains("whatsapp") ? "whatsapp" : "shopee";

        // Process autonomously in background thread with WakeLock
        processAutonomousMessage(title, channel, cleanText, replyAction);
    }

    private void processAutonomousMessage(String buyer, String channel, String text, Notification.Action replyAction) {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            try {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ReplyForge:AgentProcessing");
                wakeLock.acquire(8000);
            } catch (Exception ignored) {}
        }
        final PowerManager.WakeLock finalLock = wakeLock;

        executor.execute(() -> {
            try {
                String threadId = channel + ":" + buyer;

                // Check if human seller took over this thread
                if (db.isThreadPaused(threadId)) {
                    db.insertMessage(threadId, buyer, channel, "in", text);
                    Log.i(TAG, "Thread paused by seller, skipping auto-reply for: " + buyer);
                    return;
                }

                // Record incoming message in SQLite
                db.insertMessage(threadId, buyer, channel, "in", text);

                // Run Upgraded Conversational AI Engine
                ReplyForgeAiEngine.AiResponse response = ReplyForgeAiEngine.processBuyerMessage(this, buyer, text);

                if (response.isAnomaly) {
                    // Escalation to Seller
                    db.addAlert(threadId, buyer, channel, response.anomalyKind, "high",
                            response.anomalyTitle, response.anomalyReason, text, response.requestedQty, response.sku);
                    db.setThreadPaused(threadId, buyer, channel, true);

                    // Show Heads-Up Alert Notification to Seller
                    showSellerAlert(response.anomalyTitle, response.anomalyReason + "\nChat: \"" + text + "\"");
                    Log.w(TAG, "Anomaly detected for " + buyer + ": " + response.anomalyTitle);
                } else if (response.reply != null && !response.reply.trim().isEmpty()) {
                    String replyText = response.reply.trim();

                    // If Auto-Pilot is enabled, dispatch via RemoteInput immediately
                    JSONObject settings = db.getSettings();
                    String mode = settings.optString("mode", "autopilot");

                    if ("autopilot".equalsIgnoreCase(mode) && replyAction != null) {
                        lastRepliedText.put(buyer.toLowerCase().trim(), replyText);
                        sendRemoteInputReply(replyAction, replyText);
                        db.insertMessage(threadId, buyer, channel, "out", replyText);
                        Log.i(TAG, "AUTONOMOUS REPLY SENT TO " + buyer + ": " + replyText);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in autonomous message processing: " + e.getMessage(), e);
            } finally {
                if (finalLock != null && finalLock.isHeld()) {
                    try { finalLock.release(); } catch (Exception ignored) {}
                }
            }
        });
    }

    private void showSellerAlert(String title, String body) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Notification alert = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_error)
                .setContentTitle("⚠️ " + title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build();

        nm.notify((int) (System.currentTimeMillis() % 10000) + 2000, alert);
    }

    private void sendRemoteInputReply(Notification.Action action, String replyText) {
        RemoteInput[] remoteInputs = action.getRemoteInputs();
        if (remoteInputs == null) return;

        Intent intent = new Intent();
        Bundle bundle = new Bundle();
        for (RemoteInput input : remoteInputs) {
            bundle.putCharSequence(input.getResultKey(), replyText);
        }
        RemoteInput.addResultsToIntent(remoteInputs, intent, bundle);

        try {
            action.actionIntent.send(this, 0, intent);
            Log.i(TAG, "SUCCESS: Dispatched Autonomous RemoteInput response to buyer!");
        } catch (Exception e) {
            Log.e(TAG, "Failed sending RemoteInput intent: " + e.getMessage());
        }
    }

    public static void dispatchManualReply(String buyer, String text) {
        Notification.Action action = cachedActionsByBuyer.get(buyer.toLowerCase().trim());
        if (action != null && activeInstance != null) {
            lastRepliedText.put(buyer.toLowerCase().trim(), text);
            activeInstance.sendRemoteInputReply(action, text);
            Log.i(TAG, "Manual reply dispatched to " + buyer + ": " + text);
        }
    }

    private Notification.Action findQuickReplyAction(Notification notification) {
        if (notification.actions == null) return null;
        for (Notification.Action action : notification.actions) {
            if (action == null || action.getRemoteInputs() == null) continue;
            for (RemoteInput input : action.getRemoteInputs()) {
                if (input.getAllowFreeFormInput()) {
                    return action;
                }
            }
        }
        return null;
    }

    private boolean isOtpPattern(String text) {
        String lower = text.toLowerCase();
        boolean hasCodeWord = lower.contains("otp") || lower.contains("kode verifikasi") || lower.contains("pin") || lower.contains("kode rahasia");
        boolean hasWarning = lower.contains("jangan berikan") || lower.contains("rahasia") || lower.contains("hati-hati") || lower.contains("security code");
        return hasCodeWord && hasWarning;
    }
}
