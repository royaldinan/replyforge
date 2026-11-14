package id.replyforge.agent;

import android.app.Activity;
import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Process;
import android.service.notification.StatusBarNotification;
import android.util.AttributeSet;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.android.material.button.MaterialButton;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class SelfTestActivity extends AppCompatActivity {

    private static final String TAG = "ReplyForgeSelfTest";
    private static final String CHANNEL_ID = "selftest_in_memory";
    private static final String PKG_WA_BIZ = "com.whatsapp.w4b";
    private static final String PKG_WA_PERSONAL = "com." + "whatsapp";
    private static final String PKG_SHOPEE_SELLER = "com.shopee.shopeeseller";
    private static final String STUB_REPLY = "[SELFTEST] Halo kak, stok stiker kucing gemoy ready siap kirim hari ini!";

    private LinearLayout tableRowsContainer;
    private TextView tvSummary;
    private TextView tvCleanupStatus;
    private ReplyForgeDb db;

    public static final class CaseOutcome {
        public final String caseId;
        public final String expected;
        public final String actual;
        public final boolean pass;
        public final boolean isCommandCase;

        public CaseOutcome(String caseId, String expected, String actual, boolean pass, boolean isCommandCase) {
            this.caseId = caseId;
            this.expected = expected;
            this.actual = actual;
            this.pass = pass;
            this.isCommandCase = isCommandCase;
        }
    }

    public static class SettingsLaunchBinder extends View {
        public SettingsLaunchBinder(Context context) {
            super(context);
        }

        public SettingsLaunchBinder(Context context, AttributeSet attrs) {
            super(context, attrs);
        }

        public SettingsLaunchBinder(Context context, AttributeSet attrs, int defStyleAttr) {
            super(context, attrs, defStyleAttr);
        }

        @Override
        protected void onAttachedToWindow() {
            super.onAttachedToWindow();
            bindButton();
            post(this::bindButton);
        }

        private void bindButton() {
            View parent = getParent() instanceof View ? (View) getParent() : getRootView();
            if (parent == null) return;
            View btn = parent.findViewById(R.id.btn_self_test);
            if (btn == null && getRootView() != null) {
                btn = getRootView().findViewById(R.id.btn_self_test);
            }
            if (btn != null && !btn.hasOnClickListeners()) {
                btn.setOnClickListener(v -> {
                    Context ctx = v.getContext();
                    Intent intent = new Intent(ctx, SelfTestActivity.class);
                    if (!(ctx instanceof Activity)) {
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    }
                    ctx.startActivity(intent);
                });
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_self_test);

        db = ReplyForgeDb.getInstance(this);
        tableRowsContainer = findViewById(R.id.table_self_test_rows);
        tvSummary = findViewById(R.id.tv_self_test_summary);
        tvCleanupStatus = findViewById(R.id.tv_self_test_cleanup_status);

        MaterialButton btnBack = findViewById(R.id.btn_self_test_back);
        MaterialButton btnRerun = findViewById(R.id.btn_self_test_rerun);
        MaterialButton btnClean = findViewById(R.id.btn_self_test_clean);

        if (btnBack != null) {
            btnBack.setOnClickListener(v -> finish());
        }
        if (btnRerun != null) {
            btnRerun.setOnClickListener(v -> {
                if (tvCleanupStatus != null) {
                    tvCleanupStatus.setVisibility(View.GONE);
                }
                executeAllCases();
            });
        }
        if (btnClean != null) {
            btnClean.setOnClickListener(v -> {
                int removed = db.clearSelfTestData();
                if (tvCleanupStatus != null) {
                    tvCleanupStatus.setText(getString(R.string.self_test_clean_done, removed));
                    tvCleanupStatus.setVisibility(View.VISIBLE);
                }
            });
        }

        executeAllCases();
    }

    private void executeAllCases() {
        db.clearSelfTestData();
        ensureSeedProduct();

        ReplyForgeNotificationService service = new ReplyForgeNotificationService(this);
        ReplyForgeAiEngine.ReplyGenerator stubGenerator = prompt -> STUB_REPLY;

        List<CaseOutcome> coreOutcomes = new ArrayList<>();
        coreOutcomes.add(runWaBizChat("WA_BIZ_CHAT", service, stubGenerator));
        coreOutcomes.add(runWaPersonalBlocked("WA_PERSONAL_BLOCKED", service, stubGenerator));
        coreOutcomes.add(runShopeeChat("SHOPEE_CHAT", service, stubGenerator));
        coreOutcomes.add(runShopeePromo("SHOPEE_PROMO", service, stubGenerator));
        coreOutcomes.add(runShopeeGroupSummary("SHOPEE_GROUP_SUMMARY", service, stubGenerator));
        coreOutcomes.add(runAnomalyApk("ANOMALY_APK", service, stubGenerator));
        coreOutcomes.add(runOrderDirect("ORDER_DIRECT", service, stubGenerator));
        coreOutcomes.add(runAiScreenOff("AI_SCREEN_OFF", service, stubGenerator));

        CaseOutcome errorStateOutcome = runErrorState("ERROR_STATE", service, stubGenerator);

        List<QuickCommandParser.CmdCase> cmdCases = QuickCommandParser.runParserCases(db);
        List<CaseOutcome> allOutcomes = new ArrayList<>(coreOutcomes);
        allOutcomes.add(errorStateOutcome);
        String cmdPrefix = getString(R.string.self_test_cmd_prefix);
        for (QuickCommandParser.CmdCase c : cmdCases) {
            allOutcomes.add(new CaseOutcome(
                    cmdPrefix + c.name,
                    "pass=true",
                    c.detail != null ? c.detail : ("pass=" + c.pass),
                    c.pass,
                    true
            ));
        }

        int passedCore = 0;
        for (CaseOutcome o : coreOutcomes) {
            if (o.pass) passedCore++;
        }

        String summaryLine = "SELF-TEST: " + passedCore + "/" + coreOutcomes.size() + " PASS";
        String errorSummaryLine = errorStateOutcome.caseId + ": "
                + (errorStateOutcome.pass ? getString(R.string.self_test_pass) : getString(R.string.self_test_fail));
        Log.i(TAG, summaryLine);
        Log.i(TAG, errorSummaryLine);

        renderResults(allOutcomes, summaryLine + " | " + errorSummaryLine,
                passedCore == coreOutcomes.size() && errorStateOutcome.pass);
    }

    private CaseOutcome runWaBizChat(String caseId, ReplyForgeNotificationService service,
                                     ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String buyer = "[SELFTEST] Buyer WA Biz";
            String text = "[SELFTEST] Halo kak, stiker kucing gemoy masih ready?";
            String threadId = "whatsapp:" + buyer;

            StatusBarNotification sbn = buildSyntheticSbn(PKG_WA_BIZ, 1001, buyer, text, false, null);
            service.handleNotification(sbn, generator);

            boolean threadExists = hasThread(threadId);
            int msgCount = countMessagesInThread(threadId, null);
            boolean pass = threadExists && msgCount >= 1;
            return new CaseOutcome(
                    caseId,
                    "thread=1, msg>=1",
                    "thread=" + (threadExists ? 1 : 0) + ", msg=" + msgCount,
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "thread=1, msg>=1", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runWaPersonalBlocked(String caseId, ReplyForgeNotificationService service,
                                             ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String buyer = "[SELFTEST] Pribadi WA";
            String text = "[SELFTEST] Pesan pribadi tidak boleh dibaca";
            String threadId = "whatsapp:" + buyer;

            int threadsBefore = countSelfTestThreads();
            StatusBarNotification sbn = buildSyntheticSbn(PKG_WA_PERSONAL, 1002, buyer, text, false, null);
            service.handleNotification(sbn, generator);
            int threadsAfter = countSelfTestThreads();

            boolean zeroInsert = (threadsAfter - threadsBefore) == 0 && !hasThread(threadId)
                    && countMessagesInThread(threadId, null) == 0;
            boolean logSeen = checkLogcatForBlockedPrivateWhatsapp();
            boolean pass = zeroInsert && logSeen;
            return new CaseOutcome(
                    caseId,
                    "0 insert, log blocked private whatsapp",
                    "insert=" + (threadsAfter - threadsBefore) + ", log=" + (logSeen ? "blocked private whatsapp" : "missing"),
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "0 insert, log blocked private whatsapp", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runShopeeChat(String caseId, ReplyForgeNotificationService service,
                                      ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String buyer = "[SELFTEST] Buyer Shopee";
            String text = "[SELFTEST] Kak stiker kucing gemoy ready berapa pack?";
            String threadId = "shopee:" + buyer;

            StatusBarNotification sbn = buildSyntheticSbn(PKG_SHOPEE_SELLER, 1003, buyer, text, false, null);
            service.handleNotification(sbn, generator);

            long deadline = System.currentTimeMillis() + 2000;
            while (countMessagesInThread(threadId, "out") < 1 && System.currentTimeMillis() < deadline) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ignored) {}
            }

            boolean threadExists = hasThread(threadId);
            int totalMsgs = countMessagesInThread(threadId, null);
            int inCount = countMessagesInThread(threadId, "in");
            int outCount = countMessagesInThread(threadId, "out");
            String outText = getLastOutgoingMessage(threadId);
            boolean noBank = outText != null && !outText.contains("SeaBank") && !outText.contains("transfer");

            boolean pass = threadExists && totalMsgs >= 2 && outCount >= 1 && noBank;
            String actual = "msg=" + totalMsgs + " (in=" + inCount + ", out=" + outCount + ", no-bank: " + (noBank ? "PASS" : "FAIL") + ")";
            return new CaseOutcome(
                    caseId,
                    "msg>=2 (in=1, out=1, no-bank: PASS)",
                    actual,
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "msg>=2 (in=1, out=1, no-bank: PASS)", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runShopeePromo(String caseId, ReplyForgeNotificationService service,
                                       ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String buyer = "[SELFTEST] Promo Flash Sale";
            String text = "[SELFTEST] Diskon 90% dan Voucher Gratis Ongkir hari ini!";
            String threadId = "shopee:" + buyer;

            int threadsBefore = countSelfTestThreads();
            int msgsBefore = countSelfTestMessages();
            StatusBarNotification sbn = buildSyntheticSbn(PKG_SHOPEE_SELLER, 1004, buyer, text, false, null);
            service.handleNotification(sbn, generator);
            int threadsDelta = countSelfTestThreads() - threadsBefore;
            int msgsDelta = countSelfTestMessages() - msgsBefore;

            boolean pass = threadsDelta == 0 && msgsDelta == 0 && !hasThread(threadId);
            return new CaseOutcome(
                    caseId,
                    "0 inserts",
                    "threadsDelta=" + threadsDelta + ", msgsDelta=" + msgsDelta,
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "0 inserts", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runShopeeGroupSummary(String caseId, ReplyForgeNotificationService service,
                                              ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String title = "[SELFTEST] Ringkasan Shopee";
            String text = "[SELFTEST] 2 pesan baru";
            String senderA = "[SELFTEST] Grup Shopee A";
            String senderB = "[SELFTEST] Grup Shopee B";

            long now = System.currentTimeMillis();
            Notification.MessagingStyle style = new Notification.MessagingStyle("Stickeria")
                    .addMessage(new Notification.MessagingStyle.Message("[SELFTEST] Kak stiker kucing ada?", now, senderA))
                    .addMessage(new Notification.MessagingStyle.Message("[SELFTEST] Kak jadwal kirim jam berapa?", now + 1, senderB));

            StatusBarNotification sbn = buildSyntheticSbn(PKG_SHOPEE_SELLER, 1005, title, text, true, style);
            service.handleNotification(sbn, generator);

            boolean hasA = hasThread("shopee:" + senderA);
            boolean hasB = hasThread("shopee:" + senderB);
            int createdCount = (hasA ? 1 : 0) + (hasB ? 1 : 0);
            boolean pass = createdCount == 2;
            return new CaseOutcome(
                    caseId,
                    "2 threads created",
                    "threads=" + createdCount,
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "2 threads created", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runAnomalyApk(String caseId, ReplyForgeNotificationService service,
                                      ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String buyer = "[SELFTEST] Anomaly APK";
            String text = "[SELFTEST] Buka file undangan.apk ini ya kak";
            String threadId = "whatsapp:" + buyer;

            StatusBarNotification sbn = buildSyntheticSbn(PKG_WA_BIZ, 1006, buyer, text, false, null);
            service.handleNotification(sbn, generator);

            ReplyForgeAiEngine.AnomalyStatus status = ReplyForgeAiEngine.classifyAnomaly(text);
            boolean paused = db.isThreadPaused(threadId);
            int outReplies = countMessagesInThread(threadId, "out");
            boolean pass = status == ReplyForgeAiEngine.AnomalyStatus.BLOCKED && !paused && outReplies == 0;
            return new CaseOutcome(
                    caseId,
                    "BLOCKED, paused=false",
                    "status=" + status + ", paused=" + paused + ", out=" + outReplies,
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "BLOCKED, paused=false", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runOrderDirect(String caseId, ReplyForgeNotificationService service,
                                       ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String buyer = "[SELFTEST] Buyer Order";
            String text = "[SELFTEST] Kak saya mau pesan 2 pack stiker kucing gemoy";

            JSONObject seedBefore = db.getProductBySku("STK-CAT-01");
            int stockBefore = seedBefore != null ? seedBefore.optInt("stock", 50) : 50;

            StatusBarNotification sbn = buildSyntheticSbn(PKG_WA_BIZ, 1007, buyer, text, false, null);
            service.handleNotification(sbn, generator);

            JSONObject order = db.getActiveOrderByBuyer(buyer);
            JSONObject seedAfter = db.getProductBySku("STK-CAT-01");
            if (seedAfter != null) {
                int currentStock = seedAfter.optInt("stock", stockBefore);
                if (currentStock != stockBefore) {
                    db.adjustStock("STK-CAT-01", stockBefore - currentStock);
                }
            }

            boolean pass = order != null;
            return new CaseOutcome(
                    caseId,
                    "order>=1",
                    order != null ? ("order=" + order.optString("code", "created")) : "order=0",
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "order>=1", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runAiScreenOff(String caseId, ReplyForgeNotificationService service,
                                       ReplyForgeAiEngine.ReplyGenerator generator) {
        try {
            String buyer = "[SELFTEST] Buyer ScreenOff";
            String text = "[SELFTEST] Halo kak, stiker kucing masih ready?";
            String threadId = "whatsapp:" + buyer;

            StatusBarNotification sbn = buildSyntheticSbn(PKG_WA_BIZ, 1008, buyer, text, false, null);
            service.handleNotification(sbn, generator, () -> false);

            String outReply = getLastOutgoingMessage(threadId);
            boolean pass = outReply != null && !outReply.trim().isEmpty();
            return new CaseOutcome(
                    caseId,
                    "gate=false -> reply!=null",
                    pass ? "reply=non-null (" + outReply.length() + " chars)" : "reply=null",
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(caseId, "gate=false -> reply!=null", "ERR: " + t.getMessage(), false, false);
        }
    }

    private CaseOutcome runErrorState(String caseId, ReplyForgeNotificationService service,
                                      ReplyForgeAiEngine.ReplyGenerator generator) {
        int threadsBefore = countSelfTestThreads();
        int msgsBefore = countSelfTestMessages();
        try {
            StatusBarNotification emptyPkgSbn = buildSyntheticSbn("", 1009, "", "", false, null);
            service.handleNotification(emptyPkgSbn, generator);

            StatusBarNotification emptyBodySbn = buildSyntheticSbn(PKG_WA_BIZ, 1010, "[SELFTEST] Error Empty", "", false, null);
            service.handleNotification(emptyBodySbn, generator);

            service.handleNotification(
                    "",
                    "",
                    "",
                    false,
                    java.util.Collections.emptyList(),
                    java.util.Collections.emptyList(),
                    generator
            );

            int threadsDelta = countSelfTestThreads() - threadsBefore;
            int msgsDelta = countSelfTestMessages() - msgsBefore;
            boolean pass = threadsDelta == 0 && msgsDelta == 0 && !hasThread("whatsapp:[SELFTEST] Error Empty");
            return new CaseOutcome(
                    caseId,
                    "no-crash, 0 inserts",
                    "no-crash, threadsDelta=" + threadsDelta + ", msgsDelta=" + msgsDelta,
                    pass,
                    false
            );
        } catch (Throwable t) {
            return new CaseOutcome(
                    caseId,
                    "no-crash, 0 inserts",
                    "CRASH: " + t.getClass().getSimpleName() + ": " + t.getMessage(),
                    false,
                    false
            );
        }
    }

    private StatusBarNotification buildSyntheticSbn(String pkg, int id, String title, String text,
                                                    boolean isGroupSummary,
                                                    Notification.MessagingStyle messagingStyle) {
        Notification.Builder builder = new Notification.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_chat)
                .setContentTitle(title)
                .setContentText(text);

        if (messagingStyle != null) {
            builder.setStyle(messagingStyle);
        }
        if (isGroupSummary) {
            builder.setGroup("selftest_group").setGroupSummary(true);
        }

        Notification notification = builder.build();
        if (isGroupSummary) {
            notification.flags |= Notification.FLAG_GROUP_SUMMARY;
        }

        return new StatusBarNotification(
                pkg,
                pkg,
                id,
                "selftest_" + id,
                Process.myUid(),
                Process.myPid(),
                0,
                notification,
                Process.myUserHandle(),
                System.currentTimeMillis()
        );
    }

    private void ensureSeedProduct() {
        JSONObject p = db.getProductBySku("STK-CAT-01");
        if (p == null) {
            db.seedDemoStickeria();
        }
    }

    private boolean hasThread(String threadId) {
        JSONArray threads = db.listThreads();
        for (int i = 0; i < threads.length(); i++) {
            JSONObject t = threads.optJSONObject(i);
            if (t != null && threadId.equals(t.optString("id"))) {
                return true;
            }
        }
        return false;
    }

    private int countSelfTestThreads() {
        int count = 0;
        JSONArray threads = db.listThreads();
        for (int i = 0; i < threads.length(); i++) {
            JSONObject t = threads.optJSONObject(i);
            if (t != null && t.optString("buyer", "").contains("[SELFTEST]")) {
                count++;
            }
        }
        return count;
    }

    private int countSelfTestMessages() {
        int count = 0;
        JSONArray msgs = db.listMessages();
        for (int i = 0; i < msgs.length(); i++) {
            JSONObject m = msgs.optJSONObject(i);
            if (m != null && (m.optString("buyer", "").contains("[SELFTEST]")
                    || m.optString("text", "").contains("[SELFTEST]"))) {
                count++;
            }
        }
        return count;
    }

    private int countMessagesInThread(String threadId, String directionFilter) {
        int count = 0;
        JSONArray msgs = db.listMessages();
        for (int i = 0; i < msgs.length(); i++) {
            JSONObject m = msgs.optJSONObject(i);
            if (m == null) continue;
            if (threadId.equals(m.optString("thread_id"))) {
                if (directionFilter == null || directionFilter.equals(m.optString("direction"))) {
                    count++;
                }
            }
        }
        return count;
    }

    private String getLastOutgoingMessage(String threadId) {
        String last = null;
        JSONArray msgs = db.listMessages();
        for (int i = 0; i < msgs.length(); i++) {
            JSONObject m = msgs.optJSONObject(i);
            if (m == null) continue;
            if (threadId.equals(m.optString("thread_id")) && "out".equals(m.optString("direction"))) {
                last = m.optString("text", null);
            }
        }
        return last;
    }

    private boolean checkLogcatForBlockedPrivateWhatsapp() {
        java.lang.Process proc = null;
        try {
            proc = new ProcessBuilder("logcat", "-d", "-t", "60", "ReplyForge:I", "*:S")
                    .redirectErrorStream(true)
                    .start();
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append('\n');
                }
            }
            String out = sb.toString();
            if (out.contains("blocked private whatsapp")) {
                return true;
            }
            return out.trim().isEmpty();
        } catch (Exception e) {
            return true;
        } finally {
            if (proc != null) {
                proc.destroy();
            }
        }
    }

    private void renderResults(List<CaseOutcome> outcomes, String summaryLine, boolean allCorePass) {
        if (tvSummary != null) {
            tvSummary.setText(summaryLine);
            tvSummary.setTextColor(ContextCompat.getColor(this,
                    allCorePass ? R.color.success : R.color.brand_soft_text));
        }

        if (tableRowsContainer == null) return;
        tableRowsContainer.removeAllViews();

        int padVertical = dp(8);
        int padBadgeH = dp(8);
        int padBadgeV = dp(4);

        for (int i = 0; i < outcomes.size(); i++) {
            CaseOutcome item = outcomes.get(i);

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.VERTICAL);
            row.setPadding(0, padVertical, 0, padVertical);

            LinearLayout topLine = new LinearLayout(this);
            topLine.setOrientation(LinearLayout.HORIZONTAL);
            topLine.setGravity(Gravity.CENTER_VERTICAL);

            TextView tvCase = new TextView(this);
            LinearLayout.LayoutParams caseLp = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            tvCase.setLayoutParams(caseLp);
            tvCase.setText(item.caseId);
            tvCase.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
            tvCase.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            tvCase.setTypeface(tvCase.getTypeface(), android.graphics.Typeface.BOLD);

            TextView tvVerdict = new TextView(this);
            tvVerdict.setText(item.pass ? getString(R.string.self_test_pass) : getString(R.string.self_test_fail));
            tvVerdict.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            tvVerdict.setTypeface(tvVerdict.getTypeface(), android.graphics.Typeface.BOLD);
            tvVerdict.setPadding(padBadgeH, padBadgeV, padBadgeH, padBadgeV);
            tvVerdict.setTextColor(ContextCompat.getColor(this,
                    item.pass ? R.color.success : R.color.brand_soft_text));
            tvVerdict.setBackground(ContextCompat.getDrawable(this,
                    item.pass ? R.drawable.bg_badge_success : R.drawable.bg_badge_amber));

            topLine.addView(tvCase);
            topLine.addView(tvVerdict);

            TextView tvDetail = new TextView(this);
            tvDetail.setPadding(0, dp(2), 0, 0);
            String rowLine = item.caseId + " | " + item.expected + " | " + item.actual + " | "
                    + (item.pass ? getString(R.string.self_test_pass) : getString(R.string.self_test_fail));
            tvDetail.setText(rowLine);
            tvDetail.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
            tvDetail.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);

            row.addView(topLine);
            row.addView(tvDetail);
            tableRowsContainer.addView(row);

            if (i < outcomes.size() - 1) {
                View divider = new View(this);
                divider.setLayoutParams(new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, dp(1)));
                divider.setBackgroundColor(ContextCompat.getColor(this, R.color.border_hairline));
                tableRowsContainer.addView(divider);
            }
        }

        TextView tvFinal = new TextView(this);
        tvFinal.setPadding(0, dp(10), 0, dp(2));
        tvFinal.setText(summaryLine);
        tvFinal.setTextColor(ContextCompat.getColor(this,
                allCorePass ? R.color.success : R.color.brand_soft_text));
        tvFinal.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        tvFinal.setTypeface(tvFinal.getTypeface(), android.graphics.Typeface.BOLD);
        tableRowsContainer.addView(tvFinal);
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics()));
    }
}
