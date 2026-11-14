package id.replyforge.agent;

import android.app.PendingIntent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.text.InputType;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.chip.Chip;
import id.replyforge.agent.ReplyForgeAiEngine.AnomalyStatus;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

public class ChatDetailActivity extends AppCompatActivity {

    private String threadId;
    private String buyer;
    private String channel;

    private TextView tvBuyer, tvHandle, tvTakeover;
    private Button btnResumeAi, btnManualSend;
    private Chip tvReviewChip;
    private LinearLayout llNeedsReview;
    private RecyclerView rvMessages;
    private LinearLayout llFloatingOrder;
    private TextView tvOrderTitle, tvOrderTotal, tvOrderItems;
    private Button btnConfirmPaid, btnCancelOrder;
    private EditText etInput;
    private Button btnSend;
    private View llShopeeCopilot;
    private Button btnOpenShopeeChat, btnConfirmShopeeCheckout;

    private ReplyForgeDb db;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable refresher = new Runnable() {
        @Override
        public void run() {
            loadMessages();
            loadActiveOrder();
            handler.postDelayed(this, 2500);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_detail);

        db = ReplyForgeDb.getInstance(this);

        threadId = getIntent().getStringExtra("thread_id");
        buyer = getIntent().getStringExtra("buyer");
        channel = getIntent().getStringExtra("channel");

        if (threadId == null) threadId = "whatsapp:" + buyer;
        if (buyer == null) buyer = "Pembeli";
        if (channel == null) channel = "whatsapp";

        Button btnBack = findViewById(R.id.btn_chat_back);
        LinearLayout llRoot = findViewById(R.id.ll_chat_detail_root);
        tvBuyer = findViewById(R.id.tv_detail_buyer);
        tvHandle = findViewById(R.id.tv_detail_handle);
        tvTakeover = findViewById(R.id.tv_detail_takeover);
        btnResumeAi = findViewById(R.id.btn_resume_ai);
        llNeedsReview = findViewById(R.id.ll_needs_review);
        tvReviewChip = findViewById(R.id.tv_review_chip);
        btnManualSend = findViewById(R.id.btn_manual_send);
        rvMessages = findViewById(R.id.rv_messages);
        llFloatingOrder = findViewById(R.id.ll_floating_order);
        tvOrderTitle = findViewById(R.id.tv_order_banner_title);
        tvOrderTotal = findViewById(R.id.tv_order_banner_total);
        tvOrderItems = findViewById(R.id.tv_order_banner_items);
        btnConfirmPaid = findViewById(R.id.btn_order_confirm_paid);
        btnCancelOrder = findViewById(R.id.btn_order_cancel);
        etInput = findViewById(R.id.et_chat_input);
        btnSend = findViewById(R.id.btn_chat_send);

        boolean isWhatsApp = "whatsapp".equalsIgnoreCase(channel);
        if (llRoot != null) {
            llRoot.setBackgroundColor(ContextCompat.getColor(
                    this,
                    isWhatsApp ? R.color.channel_wa_wash : R.color.channel_shopee_wash));
        }

        tvBuyer.setText(buyer);
        tvHandle.setText((isWhatsApp ? "WhatsApp" : "Shopee") + " · " + threadId);
        tvHandle.setBackground(ContextCompat.getDrawable(
                this,
                isWhatsApp ? R.drawable.bg_badge_channel_wa : R.drawable.bg_badge_channel_shopee));
        tvHandle.setTextColor(ContextCompat.getColor(
                this,
                isWhatsApp ? R.color.channel_wa : R.color.channel_shopee));
        tvHandle.setContentDescription(isWhatsApp ? "Percakapan WhatsApp" : "Percakapan Shopee");

        rvMessages.setLayoutManager(new LinearLayoutManager(this));

        btnBack.setOnClickListener(v -> finish());

        tvTakeover.setOnClickListener(v -> {
            boolean isPaused = db.isThreadPaused(threadId);
            db.setThreadPaused(threadId, buyer, channel, !isPaused);
            updateTakeoverUi(!isPaused);
        });

        btnResumeAi.setOnClickListener(v -> {
            db.setThreadPaused(threadId, buyer, channel, false);
            updateTakeoverUi(false);
        });

        btnSend.setOnClickListener(v -> {
            String text = etInput.getText().toString().trim();
            if (text.isEmpty()) return;
            db.insertMessage(threadId, buyer, channel, "out", text);
            if ("shopee".equalsIgnoreCase(channel)) {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Balasan Shopee", text));
                Toast.makeText(this, "Draf disalin. Tempel & kirim di aplikasi Shopee ya.", Toast.LENGTH_LONG).show();
            } else {
                ReplyForgeNotificationService.dispatchManualReply(buyer, text, "whatsapp");
                Toast.makeText(this, "Balasan terkirim ke " + buyer, Toast.LENGTH_SHORT).show();
            }
            etInput.setText("");
            loadMessages();
        });

        btnManualSend.setOnClickListener(v -> {
            String text = etInput.getText().toString().trim();
            if (!text.isEmpty()) {
                btnSend.performClick();
            } else {
                etInput.requestFocus();
                InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) {
                    imm.showSoftInput(etInput, InputMethodManager.SHOW_IMPLICIT);
                }
            }
        });

        llShopeeCopilot = findViewById(R.id.ll_shopee_copilot_bar);
        btnOpenShopeeChat = findViewById(R.id.btn_open_shopee_chat);
        btnConfirmShopeeCheckout = findViewById(R.id.btn_confirm_shopee_checkout);

        String lastText = "";
        JSONArray recentMsgs = db.getRecentThreadMessages(threadId, 5);
        if (recentMsgs != null && recentMsgs.length() > 0) {
            for (int i = recentMsgs.length() - 1; i >= 0; i--) {
                JSONObject m = recentMsgs.optJSONObject(i);
                if (m != null && "in".equalsIgnoreCase(m.optString("direction", ""))) {
                    lastText = m.optString("text", "");
                    break;
                }
            }
            if (lastText.isEmpty()) {
                JSONObject last = recentMsgs.optJSONObject(recentMsgs.length() - 1);
                if (last != null) {
                    lastText = last.optString("text", "");
                }
            }
        }

        if (!isWhatsApp && llShopeeCopilot != null) {
            llShopeeCopilot.setVisibility(View.VISIBLE);
            if (btnOpenShopeeChat != null) {
                btnOpenShopeeChat.setOnClickListener(v -> openAndReplyInShopee());
            }
            if (btnConfirmShopeeCheckout != null) {
                btnConfirmShopeeCheckout.setOnClickListener(v -> showShopeeCheckoutDialog());
            }
            updateShopeeActionBar();
        }

        updateTakeoverUi(db.isThreadPaused(threadId));
    }

    private void updateTakeoverUi(boolean paused) {
        boolean isWhatsApp = "whatsapp".equalsIgnoreCase(channel);
        if (paused) {
            tvTakeover.setText("AI Dijeda");
            tvTakeover.setBackground(ContextCompat.getDrawable(this, R.drawable.bg_badge_amber));
            tvTakeover.setBackgroundTintList(ColorStateList.valueOf(0xFFFFFBEB));
            tvTakeover.setTextColor(0xFFD97706);
            btnResumeAi.setVisibility(View.VISIBLE);
        } else {
            tvTakeover.setText(isWhatsApp ? "● Autopilot" : "● Smart Copilot");
            tvTakeover.setBackground(ContextCompat.getDrawable(
                    this,
                    isWhatsApp ? R.drawable.bg_badge_channel_wa : R.drawable.bg_badge_channel_shopee));
            tvTakeover.setBackgroundTintList(null);
            tvTakeover.setTextColor(ContextCompat.getColor(
                    this,
                    isWhatsApp ? R.color.channel_wa : R.color.channel_shopee));
            btnResumeAi.setVisibility(View.GONE);
        }
    }

    private void updateReviewUi(boolean needsReview) {
        int visibility = needsReview ? View.VISIBLE : View.GONE;
        llNeedsReview.setVisibility(visibility);
        tvReviewChip.setVisibility(visibility);
        btnManualSend.setVisibility(visibility);
    }

    private boolean isThreadNeedsReview(JSONArray threadMessages) {
        try {
            if (threadMessages != null && threadMessages.length() > 0) {
                JSONObject last = threadMessages.getJSONObject(threadMessages.length() - 1);
                String lastText = last.optString("text", "");
                // Outgoing bubbles (invoice / AI reply) are never evidence of a risky BUYER message.
                if ("out".equalsIgnoreCase(last.optString("direction", ""))) {
                    return false;
                }
                if (ReplyForgeAiEngine.classifyAnomaly(lastText) == ReplyForgeAiEngine.AnomalyStatus.NEEDS_REVIEW) {
                    return true;
                }
            }
            JSONArray alerts = db.listAlerts();
            for (int i = 0; i < alerts.length(); i++) {
                JSONObject a = alerts.getJSONObject(i);
                if ("open".equalsIgnoreCase(a.optString("status", ""))
                        && "NEEDS_REVIEW".equalsIgnoreCase(a.optString("kind", ""))
                        && (threadId.equals(a.optString("thread_id", ""))
                            || buyer.equalsIgnoreCase(a.optString("buyer", "")))) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.post(refresher);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(refresher);
    }

    private void loadMessages() {
        JSONArray all = db.listMessages();
        JSONArray filtered = new JSONArray();
        for (int i = 0; i < all.length(); i++) {
            try {
                JSONObject m = all.getJSONObject(i);
                String tId = m.optString("thread_id", "");
                String b = m.optString("buyer", "");
                if (tId.equals(threadId) || b.equalsIgnoreCase(buyer)) {
                    filtered.put(m);
                }
            } catch (Exception ignored) {}
        }
        rvMessages.setAdapter(new ChatMessageAdapter(filtered, channel));
        if (filtered.length() > 0) {
            rvMessages.scrollToPosition(filtered.length() - 1);
        }
        updateTakeoverUi(db.isThreadPaused(threadId));
        updateReviewUi(isThreadNeedsReview(filtered));
        updateShopeeActionBar();
    }

    private void loadActiveOrder() {
        JSONObject order = db.getActiveOrderByBuyer(buyer);
        if (order != null) {
            int orderId = order.optInt("id", 0);
            String code = order.optString("code", "");
            int total = order.optInt("total", 0);

            JSONArray items = order.optJSONArray("items");
            StringBuilder sb = new StringBuilder();
            if (items != null) {
                for (int i = 0; i < items.length(); i++) {
                    try {
                        JSONObject it = items.getJSONObject(i);
                        if (sb.length() > 0) sb.append(", ");
                        sb.append(it.optInt("quantity", 1)).append("x ").append(it.optString("sku", "Barang"));
                    } catch (Exception ignored) {}
                }
            }

            tvOrderTitle.setText("Pesanan Menunggu Transfer (" + code + ")");
            tvOrderTotal.setText("Rp" + String.format(Locale.GERMANY, "%,d", total));
            tvOrderItems.setText(sb.length() > 0 ? sb.toString() : "Rincian barang");
            llFloatingOrder.setVisibility(View.VISIBLE);

            btnConfirmPaid.setOnClickListener(v -> {
                db.updateOrderStatus(orderId, "paid");
                String storeCity = db.getSettings().optString("storeCity", "Bandung");
                String confirmationMsg = "Halo kak " + buyer + ", pembayaran pesanan Anda telah kami terima dan terkonfirmasi lunas ya! Paket Anda sedang dikemas dan segera dikirim hari ini dari " + storeCity + ". Terima kasih telah berbelanja di Stickeria! 📦✨";
                db.insertMessage(threadId, buyer, channel, "out", confirmationMsg);
                ReplyForgeNotificationService.dispatchManualReply(buyer, confirmationMsg, channel);
                Toast.makeText(this, "Pesanan " + code + " LUNAS! Konfirmasi terkirim ke pembeli.", Toast.LENGTH_SHORT).show();
                llFloatingOrder.setVisibility(View.GONE);
                loadMessages();
            });

            btnCancelOrder.setOnClickListener(v -> {
                db.updateOrderStatus(orderId, "cancelled");
                Toast.makeText(this, "Pesanan " + code + " DIBATALKAN. Stok dikembalikan.", Toast.LENGTH_SHORT).show();
                llFloatingOrder.setVisibility(View.GONE);
                loadMessages();
            });
        } else {
            llFloatingOrder.setVisibility(View.GONE);
        }
    }

    private void openAndReplyInShopee() {
        String lastReply = "";
        JSONArray msgs = db.getRecentThreadMessages(threadId, 5);
        for (int i = msgs.length() - 1; i >= 0; i--) {
            try {
                JSONObject m = msgs.getJSONObject(i);
                if ("out".equalsIgnoreCase(m.optString("direction", ""))) {
                    lastReply = m.optString("text", "");
                    break;
                }
            } catch (Exception ignored) {}
        }
        if (lastReply.isEmpty()) {
            lastReply = "Halo kak! Produk ready stok siap kirim hari ini. Silakan langsung checkout melalui keranjang Shopee ya kak!";
        }

        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("Balasan Shopee", lastReply));
        }

        // Direct, verifiable launch of the Shopee app (Seller Centre first, buyer app as fallback).
        boolean launched = false;
        Intent launch = getPackageManager().getLaunchIntentForPackage("com.shopee.shopeeseller");
        if (launch == null) {
            launch = getPackageManager().getLaunchIntentForPackage("com.shopee.id");
        }
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                startActivity(launch);
                launched = true;
            } catch (Exception e) {
                Log.w("ReplyForge", "Shopee launch failed: " + e.getMessage());
            }
        }

        if (launched) {
            Toast.makeText(this, "Balasan disalin. Tempel di chat Shopee pembeli lalu kirim ✨", Toast.LENGTH_LONG).show();
        } else {
            Toast.makeText(this, "Aplikasi Shopee tidak terpasang di HP ini. Balasan tetap tersalin di clipboard.", Toast.LENGTH_LONG).show();
        }
    }

    private void showShopeeCheckoutDialog() {
        JSONObject existing = db.getLatestShopeeOrderForThread(threadId, buyer);
        if (existing != null) {
            String st = existing.optString("status", "");
            if ("paid".equalsIgnoreCase(st) || "cancelled".equalsIgnoreCase(st)) {
                updateShopeeActionBar();
                Toast.makeText(this, "Checkout thread ini sudah tercatat (" + existing.optString("code", "-") + "). Tidak bisa dipotong dua kali.", Toast.LENGTH_LONG).show();
                return;
            }
        }

        JSONArray prods = db.listProducts();
        if (prods.length() == 0) {
            Toast.makeText(this, "Katalog produk kosong.", Toast.LENGTH_SHORT).show();
            return;
        }

        final java.util.List<JSONObject> productList = new java.util.ArrayList<>();
        java.util.List<String> labels = new java.util.ArrayList<>();
        for (int i = 0; i < prods.length(); i++) {
            JSONObject p = prods.optJSONObject(i);
            if (p == null) continue;
            productList.add(p);
            labels.add(p.optString("name", "Produk") + " · Rp" + String.format(Locale.GERMANY, "%,d", p.optInt("price", 0))
                    + " · stok " + p.optInt("stock", 0));
        }
        if (productList.isEmpty()) return;

        float density = getResources().getDisplayMetrics().density;
        int pad = (int) (18 * density);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(pad, pad, pad, pad);

        TextView lblProduct = new TextView(this);
        lblProduct.setText("Produk yang dibeli di Shopee:");
        lblProduct.setTextSize(12);
        box.addView(lblProduct);

        Spinner spinner = new Spinner(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, labels);
        spinner.setAdapter(adapter);
        box.addView(spinner);

        TextView lblQty = new TextView(this);
        lblQty.setText("Jumlah pack/pcs (yang benar-benar dibayar):");
        lblQty.setTextSize(12);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = (int) (10 * density);
        lblQty.setLayoutParams(lp);
        box.addView(lblQty);

        EditText qtyInput = new EditText(this);
        qtyInput.setInputType(InputType.TYPE_CLASS_NUMBER);
        qtyInput.setText("1");
        qtyInput.setSelection(1);
        box.addView(qtyInput);

        new AlertDialog.Builder(this)
                .setTitle("Konfirmasi Checkout Shopee")
                .setView(box)
                .setPositiveButton("Potong Stok Sekali", (dialog, which) -> {
                    int idx = spinner.getSelectedItemPosition();
                    if (idx < 0 || idx >= productList.size()) idx = 0;
                    JSONObject chosen = productList.get(idx);
                    String sku = chosen.optString("sku", "");
                    int unitPrice = chosen.optInt("price", 0);
                    int stock = chosen.optInt("stock", 0);

                    int qty = 1;
                    try {
                        qty = Integer.parseInt(qtyInput.getText().toString().trim());
                    } catch (Exception ignored) {}
                    if (qty <= 0) qty = 1;

                    if (qty > stock) {
                        Toast.makeText(this, "Stok " + chosen.optString("name", "produk") + " tersisa " + stock + ". Tidak dipotong.", Toast.LENGTH_LONG).show();
                        return;
                    }

                    JSONObject order = db.insertOrder(buyer, "shopee", sku, qty, unitPrice, "paid",
                            "Checkout Shopee diverifikasi seller", threadId);
                    if (order != null) {
                        db.insertMessage(threadId, buyer, "shopee", "out",
                                "Terima kasih kak " + buyer + "! Pesanan " + qty + " " + chosen.optString("name", "produk")
                                        + " sudah kami catat dan stok fisik sudah disesuaikan. Paket segera kami kemas ya ✨");
                        db.setThreadPaused(threadId, buyer, "shopee", true);
                        Toast.makeText(this, "Tercatat " + order.optString("code", "") + " · stok -" + qty + " pack", Toast.LENGTH_LONG).show();
                    }
                    updateShopeeActionBar();
                    loadMessages();
                })
                .setNegativeButton("Batal", null)
                .show();
    }

    private boolean isShopeeOrderResolved() {
        if ("whatsapp".equalsIgnoreCase(channel)) return false;
        JSONObject order = db.getLatestShopeeOrderForThread(threadId, buyer);
        if (order == null) return false;
        String st = order.optString("status", "");
        return "paid".equalsIgnoreCase(st) || "cancelled".equalsIgnoreCase(st);
    }

    private void updateShopeeActionBar() {
        if (llShopeeCopilot == null || btnConfirmShopeeCheckout == null) return;
        if (isShopeeOrderResolved()) {
            btnConfirmShopeeCheckout.setEnabled(false);
            btnConfirmShopeeCheckout.setText("✓ Checkout Tercatat");
            btnConfirmShopeeCheckout.setAlpha(0.65f);
        } else {
            btnConfirmShopeeCheckout.setEnabled(true);
            btnConfirmShopeeCheckout.setText("✓ Potong Stok");
            btnConfirmShopeeCheckout.setAlpha(1f);
        }
    }
}
