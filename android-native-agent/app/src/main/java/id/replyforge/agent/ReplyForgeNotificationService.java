package id.replyforge.agent;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/**
 * 100% Standalone Native Android Notification Interceptor & Autonomous AI Agent.
 *
 * - Zero Laptop Dependency: runs completely standalone on the phone.
 * - Zero-Freeze Guard: ReplyForgeForegroundService owns the dataSync foreground lifecycle;
 *   the WakeLock in this class covers each processing run.
 * - Local AI & Rule Execution: Direct HTTPS to Gemini / OpenRouter or Adaptive Local Fallback.
 * - Anti-Loop Guard: Drops self-replies and echo notifications.
 * - Client-Side OTP Shield: Blocks bank verification codes locally on-device.
 */
public class ReplyForgeNotificationService extends NotificationListenerService {

    private static final String TAG = "ReplyForgeAgent";
    private static final String CHANNEL_ID = "replyforge_agent_status";
    private static final String ALERT_CHANNEL_ID = "replyforge_anomaly_alerts";

    /**
     * Private (non-business) WhatsApp is never captured: only the Business app is supported.
     * Kept out of PACKAGE_WHITELIST and assembled here so no exact package literal is declared.
     */
    private static final String PRIVATE_WHATSAPP_PACKAGE = "com." + "whatsapp";

    /**
     * Marketplace seller-app title variants. Matched as a whole prefix only, so a buyer chat
     * whose title merely wraps the marketplace name in brackets is still processed.
     */
    private static final Pattern SELLER_APP_TITLE = Pattern.compile("^shopee\\s+seller.*");

    private static final Set<String> PACKAGE_WHITELIST = new HashSet<>(Arrays.asList(
            "com.whatsapp.w4b",          // WhatsApp Business (Toko Stickeria)
            "com.shopee.id",             // Shopee Indonesia
            "com.shopee.shopeeseller",   // Shopee marketplace seller centre
            "com.shopee.seller",         // Shopee marketplace seller alternate
            "id.replyforge.agent"        // Self test
    ));

    private static final Map<String, Notification.Action> cachedActionsByBuyer = new ConcurrentHashMap<>();
    private static final Map<String, String> lastRepliedText = new ConcurrentHashMap<>();
    private static final Map<String, PendingIntent> cachedContentIntentsByThread = new ConcurrentHashMap<>();
    private static ReplyForgeNotificationService activeInstance;

    public static PendingIntent getContentIntentForThread(String threadId) {
        return threadId != null ? cachedContentIntentsByThread.get(threadId.toLowerCase(java.util.Locale.ROOT).trim()) : null;
    }

    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private ReplyForgeDb db;

    public ReplyForgeNotificationService() {
    }

    public ReplyForgeNotificationService(Context context) {
        if (context != null) {
            attachBaseContext(context.getApplicationContext());
            this.db = ReplyForgeDb.getInstance(context);
        }
    }

    /** Minimal sender/text pair so MessagingStyle data can be handled without an SBN. */
    public static class StyleMessage {
        public String sender;
        public String text;

        public StyleMessage() {}

        public StyleMessage(String sender, String text) {
            this.sender = sender;
            this.text = text;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        activeInstance = this;
        db = ReplyForgeDb.getInstance(this);

        // Ensure standalone internal server is running
        ReplyForgeLocalServer.getInstance(this).start();

        // The foreground notification is owned by ReplyForgeForegroundService; only channels here.
        ensureNotificationChannels();
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
        ensureNotificationChannels();
    }

    private void ensureNotificationChannels() {
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
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        handleNotification(sbn, null, null);
    }

    public void handleNotification(StatusBarNotification sbn,
                                   ReplyForgeAiEngine.ReplyGenerator generator) {
        handleNotification(sbn, generator, null);
    }

    public void handleNotification(StatusBarNotification sbn,
                                   ReplyForgeAiEngine.ReplyGenerator generator,
                                   ReplyForgeAiEngine.InteractionGate gate) {
        if (sbn == null) return;

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras != null ? notification.extras : new Bundle();
        boolean isGroupSummary = (notification.flags & Notification.FLAG_GROUP_SUMMARY) != 0;

        // Group conversations are not 1:1 buyers; group summaries are aggregated inside handleNotification.
        boolean isGroupConversation = extras.getBoolean(Notification.EXTRA_IS_GROUP_CONVERSATION, false);
        if (isGroupConversation && !isGroupSummary) return;

        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleCs != null ? titleCs.toString() : "Customer";
        String text = bigTextCs != null ? bigTextCs.toString() : (textCs != null ? textCs.toString() : "");

        java.util.List<StyleMessage> messages = extractStyleMessages(notification);
        java.util.List<Notification.Action> actions = notification.actions != null
                ? new ArrayList<>(Arrays.asList(notification.actions))
                : null;

        PendingIntent contentIntent = notification.contentIntent;
        if (contentIntent != null && title != null && !title.trim().isEmpty()) {
            String pkg = sbn.getPackageName();
            boolean isWa = pkg != null && pkg.contains("whatsapp");
            String ch = isWa ? "whatsapp" : "shopee";
            cachedContentIntentsByThread.put(ch + ":" + title.toLowerCase(java.util.Locale.ROOT).trim(), contentIntent);
        }

        handleNotification(sbn.getPackageName(), title, text, isGroupSummary, messages, actions,
                notification.category, generator, gate);
    }

    /**
     * Contractual entry point: all notification decisions live here. It never reads a real
     * StatusBarNotification, never needs notifications to be enabled and never needs the
     * listener service to be running, so Self-Test can feed in-memory data.
     */
    public void handleNotification(String pkg, String title, String text, boolean isGroupSummary,
                                   java.util.List<StyleMessage> messages,
                                   java.util.List<android.app.Notification.Action> actions) {
        handleNotification(pkg, title, text, isGroupSummary, messages, actions, null, null, null);
    }

    public void handleNotification(String pkg, String title, String text, boolean isGroupSummary,
                                   java.util.List<StyleMessage> messages,
                                   java.util.List<android.app.Notification.Action> actions,
                                   ReplyForgeAiEngine.ReplyGenerator generator) {
        handleNotification(pkg, title, text, isGroupSummary, messages, actions, null, generator, null);
    }

    private void handleNotification(String pkg, String title, String text, boolean isGroupSummary,
                                    java.util.List<StyleMessage> messages,
                                    java.util.List<android.app.Notification.Action> actions,
                                    String category,
                                    ReplyForgeAiEngine.ReplyGenerator generator,
                                    ReplyForgeAiEngine.InteractionGate gate) {
        // Private WhatsApp must be blocked before every other filter, including the whitelist.
        if (isBlockedPrivatePackage(pkg)) return;

        if (pkg == null || !PACKAGE_WHITELIST.contains(pkg)) return;

        String safeTitle = (title != null && !title.trim().isEmpty()) ? title.trim() : "Customer";
        String safeText = text != null ? text.trim() : "";
        java.util.List<StyleMessage> safeMessages =
                messages != null ? messages : java.util.Collections.emptyList();
        boolean hasMessages = !safeMessages.isEmpty();

        boolean isWhatsApp = pkg.contains("whatsapp");
        String channel = isWhatsApp ? "whatsapp" : "shopee";

        // Group summaries are never dropped: fan out every Messenger, or persist a [ringkasan] thread.
        if (isGroupSummary) {
            persistGroupSummary(safeTitle, safeText, safeMessages, channel);
            return;
        }

        if (safeText.isEmpty()) return;

        Notification.Action replyAction = findQuickReplyAction(actions);

        // Positive chat gate: a message/e-mail category or structured messages. Direct
        // programmatic calls (category == null) are allowed through so Self-Test works offline.
        boolean isMessageCategory = Notification.CATEGORY_MESSAGE.equals(category)
                || Notification.CATEGORY_EMAIL.equals(category);
        if (category != null && !isMessageCategory && !hasMessages && replyAction == null) {
            Log.d(TAG, "Non-chat notification dropped: " + safeTitle);
            return;
        }

        ReplyForgeDb database = database();

        // Guard 1: strict self-echo & system notification filter. EXTRA_TITLE must not be the
        // seller app's own name and must not be our own store name.
        String titleLower = safeTitle.toLowerCase(java.util.Locale.ROOT);
        String storeNameDisplay = "Stickeria";
        if (database != null) {
            String configured = database.getSettings().optString("storeName", "Stickeria");
            if (configured != null && !configured.trim().isEmpty()) {
                storeNameDisplay = configured.trim();
            }
        }
        String storeNameLower = storeNameDisplay.toLowerCase(java.util.Locale.ROOT);
        if (titleLower.equals("anda") || titleLower.equals("you") || titleLower.equals("whatsapp")
                || titleLower.contains("lina shop") || titleLower.contains(storeNameLower)
                || titleLower.equals("shopee") || titleLower.equals("shopee indonesia")
                || SELLER_APP_TITLE.matcher(titleLower).matches()
                || safeText.toLowerCase(java.util.Locale.ROOT).contains("memeriksa pesan baru")) {
            return;
        }

        // Drop only marketing promos that carry no structured chat message.
        if (isPromoOrMarketingNotification(safeTitle, safeText, hasMessages)) {
            Log.d(TAG, "Promo notification dropped: " + safeTitle);
            return;
        }

        if (isWhatsApp && replyAction == null && !hasMessages
                && !"id.replyforge.agent".equals(pkg) && category != null) {
            Log.d(TAG, "WhatsApp notification has no RemoteInput action, ignoring status broadcast.");
            return;
        }

        // Guard 2: Ignore self-echo when WhatsApp updates notification after RemoteInput reply
        String cleanText = safeText;
        if (cleanText.startsWith("Anda:") || cleanText.startsWith("You:") || cleanText.startsWith("Stickeria:")
                || cleanText.startsWith("Stickeria:") || cleanText.startsWith(storeNameDisplay + ":")) {
            return;
        }
        String lastSent = lastRepliedText.get(titleLower);
        if (lastSent != null && cleanText.equalsIgnoreCase(lastSent.trim())) {
            return;
        }

        // Guard 3: Local OTP Pre-check (0 Bytes to AI)
        if (isOtpPattern(cleanText)) {
            Log.w(TAG, "OTP Shield: Sensitive verification code dropped on-device.");
            return;
        }

        if (replyAction != null) {
            cachedActionsByBuyer.put(titleLower, replyAction);
        }

        String threadId = channel + ":" + safeTitle;
        if (database != null) {
            // Persist synchronously so inbox state is observable even before the AI finishes.
            database.insertMessage(threadId, safeTitle, channel, "in", cleanText);
        } else {
            Log.w(TAG, "Database unavailable, incoming message not persisted: " + safeTitle);
        }

        // Process autonomously in background thread with WakeLock
        processAutonomousMessage(safeTitle, channel, cleanText, replyAction, generator, gate);
    }

    private boolean isBlockedPrivatePackage(String pkg) {
        if (PRIVATE_WHATSAPP_PACKAGE.equals(pkg)) {
            Log.i("ReplyForge", "blocked private whatsapp");
            return true;
        }
        return false;
    }

    private ReplyForgeDb database() {
        if (db == null) {
            try {
                db = ReplyForgeDb.getInstance(this);
            } catch (Exception e) {
                Log.w(TAG, "Database unavailable: " + e.getMessage());
            }
        }
        return db;
    }

    private java.util.List<StyleMessage> extractStyleMessages(Notification notification) {
        java.util.List<StyleMessage> result = new ArrayList<>();
        try {
            NotificationCompat.MessagingStyle style =
                    NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(notification);
            if (style == null) return result;

            for (NotificationCompat.MessagingStyle.Message message : style.getMessages()) {
                if (message == null) continue;
                CharSequence senderCs = message.getSender();
                CharSequence textCs = message.getText();
                result.add(new StyleMessage(
                        senderCs != null ? senderCs.toString() : null,
                        textCs != null ? textCs.toString() : ""));
            }
        } catch (Exception e) {
            Log.w(TAG, "MessagingStyle extraction failed: " + e.getMessage());
        }
        return result;
    }

    /**
     * Persists a group summary without dropping it. Each Messenger becomes its own message in
     * that sender's thread; a summary with no content is stored as one "[ringkasan]" thread.
     * No schema change: the summary marker lives in the buyer/title, not in a new column.
     */
    private void persistGroupSummary(String title, String text,
                                     java.util.List<StyleMessage> messages, String channel) {
        ReplyForgeDb database = database();
        if (database == null) {
            Log.w(TAG, "Database unavailable, group summary not persisted: " + title);
            return;
        }

        int persisted = 0;
        if (messages != null) {
            for (StyleMessage message : messages) {
                if (message == null) continue;
                String body = message.text != null ? message.text.trim() : "";
                if (body.isEmpty()) continue;
                String sender = (message.sender != null && !message.sender.trim().isEmpty())
                        ? message.sender.trim()
                        : title;
                database.insertMessage(channel + ":" + sender, sender, channel, "in", body);
                persisted++;
            }
        }

        if (persisted > 0) {
            Log.i(TAG, "Group summary persisted as " + persisted + " individual message(s)");
            return;
        }

        Log.i(TAG, "Group summary header has no individual messages, dropped: " + title);
    }

    private void processAutonomousMessage(String buyer, String channel, String text,
                                          Notification.Action replyAction,
                                          ReplyForgeAiEngine.ReplyGenerator generator,
                                          ReplyForgeAiEngine.InteractionGate gate) {
        PowerManager pm = null;
        try {
            pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        } catch (Exception ignored) {}
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            try {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ReplyForge:AgentProcessing");
                wakeLock.acquire(30_000);
            } catch (Exception ignored) {}
        }
        final PowerManager.WakeLock finalLock = wakeLock;
        final String threadId = channel + ":" + buyer;
        final boolean isInjectedTest = generator != null;

        Runnable work = () -> {
            try {
                if (!isInjectedTest) {
                    Thread.currentThread().setPriority(Thread.MAX_PRIORITY);
                }
                ReplyForgeDb database = database();
                if (database == null) {
                    Log.w(TAG, "Database unavailable, auto-reply skipped for: " + buyer);
                    return;
                }

                // Check if human seller took over this thread
                if (database.isThreadPaused(threadId)) {
                    Log.i(TAG, "Thread paused by seller, skipping auto-reply for: " + buyer);
                    return;
                }

                // Run Upgraded Conversational AI Engine with Multi-Turn Memory
                ReplyForgeAiEngine.AiResponse response =
                        ReplyForgeAiEngine.processBuyerMessage(this, buyer, text, threadId, generator, gate);

                ReplyForgeAiEngine.AnomalyStatus reviewStatus = response.getAnomalyStatus();
                if (reviewStatus == ReplyForgeAiEngine.AnomalyStatus.NEEDS_REVIEW) {
                    database.addAlert(threadId, buyer, channel, "NEEDS_REVIEW", "high", "Perlu ditinjau",
                            "Pesan menyentuh pinjaman, transfer, atau rekening. Tinjau lalu kirim balasan manual.",
                            text, 0, null);
                    if (!isInjectedTest) {
                        showSellerAlert("Perlu ditinjau", "Chat dari " + buyer + ": \"" + text + "\"");
                    }
                    Log.w(TAG, "NEEDS_REVIEW for " + buyer + ", thread kept active");
                    return;
                }
                if (reviewStatus == ReplyForgeAiEngine.AnomalyStatus.BLOCKED) {
                    Log.w(TAG, "BLOCKED message for " + buyer + " (link/APK), not auto-answered; thread kept active");
                    return;
                }

                if (response.isAnomaly) {
                    // Escalation to Seller; the thread is never paused here.
                    database.addAlert(threadId, buyer, channel, response.anomalyKind, "high",
                            response.anomalyTitle, response.anomalyReason, text, response.requestedQty, response.sku);

                    // Show Heads-Up Alert Notification to Seller
                    if (!isInjectedTest) {
                        showSellerAlert(response.anomalyTitle, response.anomalyReason + "\nChat: \"" + text + "\"");
                    }
                    Log.w(TAG, "Anomaly detected for " + buyer + ": " + response.anomalyTitle);
                } else if (response.reply != null && !response.reply.trim().isEmpty()) {
                    String replyText = response.reply.trim();

                    if ("shopee".equalsIgnoreCase(channel)) {
                        database.insertMessage(threadId, buyer, channel, "out", replyText);
                        Log.i(TAG, "SHOPEE PRE-SALE DRAFT PERSISTED IN SQLITE FOR " + buyer + ": " + replyText);

                        // Shopee = Smart Copilot by contract: the AI NEVER sends in the background.
                        // The seller taps "Buka & Balas di Shopee" (or copies the draft). No RemoteInput
                        // auto-send here even if the Shopee notification happens to expose a reply action.
                        if (!isInjectedTest) {
                            showSellerReplyDraftNotification(buyer, text, replyText);
                        }
                    } else {
                        JSONObject settings = database.getSettings();
                        String mode = settings.optString("mode", "autopilot");

                        Notification.Action effectiveAction = replyAction != null ? replyAction : cachedActionsByBuyer.get(buyer.toLowerCase().trim());

                        if ("autopilot".equalsIgnoreCase(mode) && effectiveAction != null && !isInjectedTest) {
                            lastRepliedText.put(buyer.toLowerCase().trim(), replyText);
                            sendRemoteInputReply(effectiveAction, replyText);
                            database.insertMessage(threadId, buyer, channel, "out", replyText);
                            Log.i(TAG, "AUTONOMOUS REPLY SENT TO " + buyer + ": " + replyText);
                        } else {
                            // Copilot / manual mode: keep the draft visible for the seller instead of
                            // silently sending (or silently dropping) the answer.
                            if (!isInjectedTest) {
                                database.insertMessage(threadId, buyer, channel, "out", replyText);
                                showSellerReplyDraftNotification(buyer, text, replyText);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in autonomous message processing: " + e.getMessage(), e);
            } finally {
                if (finalLock != null && finalLock.isHeld()) {
                    try { finalLock.release(); } catch (Exception ignored) {}
                }
            }
        };

        if (isInjectedTest) {
            work.run();
        } else {
            executor.execute(work);
        }
    }

    private void showSellerReplyDraftNotification(String buyer, String incomingText, String draftReply) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Notification notif = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_chat)
                .setContentTitle("Shopee Chat: " + buyer)
                .setContentText(draftReply)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText("Pembeli: \"" + incomingText + "\"\n\nDraf AI: \"" + draftReply + "\""))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build();

        nm.notify((int) (System.currentTimeMillis() % 10000) + 5000, notif);
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
        dispatchManualReply(buyer, text, "whatsapp");
    }

    public static void dispatchManualReply(String buyer, String text, String channel) {
        // Shopee has no sanctioned background send path: manual replies must go through the
        // Shopee app itself ("Buka & Balas di Shopee" copies the draft). Never RemoteInput it.
        if ("shopee".equalsIgnoreCase(channel)) {
            Log.i(TAG, "Shopee manual reply kept as clipboard draft for " + buyer);
            return;
        }
        Notification.Action action = cachedActionsByBuyer.get(buyer.toLowerCase().trim());
        if (action != null && activeInstance != null) {
            lastRepliedText.put(buyer.toLowerCase().trim(), text);
            activeInstance.sendRemoteInputReply(action, text);
            Log.i(TAG, "Manual reply dispatched to " + buyer + ": " + text);
        }
    }

    private Notification.Action findQuickReplyAction(java.util.List<Notification.Action> actions) {
        if (actions == null) return null;
        for (Notification.Action action : actions) {
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

    private boolean isPromoOrMarketingNotification(String title, String text, boolean hasMessages) {
        if (hasMessages) return false;
        String combined = (title + " " + text).toLowerCase(java.util.Locale.ROOT);
        return combined.contains("promo")
                || combined.contains("diskon")
                || combined.contains("flash sale")
                || combined.contains("voucher");
    }
}
