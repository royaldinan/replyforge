package id.replyforge.agent;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.chip.Chip;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final int REQ_PICK_CSV = 2001;

    private TextView tvMainStoreName, tvAutopilotBadge;
    private FrameLayout fragmentContainer;
    private BottomNavigationView bottomNav;
    private ReplyForgeDb db;

    private int currentTab = R.id.nav_chat;
    private String orderFilter = "all";

    private final JSONArray chatThreadsData = new JSONArray();
    private final JSONArray stockProductsData = new JSONArray();
    private final JSONArray ordersData = new JSONArray();
    private ThreadAdapter chatAdapter;
    private ProductAdapter stockAdapter;
    private OrderAdapter orderAdapter;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable autoRefresher = new Runnable() {
        @Override
        public void run() {
            refreshCurrentTab();
            handler.postDelayed(this, 3000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        db = ReplyForgeDb.getInstance(this);

        if (!db.isOnboardingCompleted()) {
            startActivity(new Intent(this, OnboardingActivity.class));
            finish();
            return;
        }

        try {
            ReplyForgeLocalServer.getInstance(this).start();
        } catch (Exception ignored) {}

        setContentView(R.layout.activity_main);

        tvMainStoreName = findViewById(R.id.tv_main_store_name);
        tvAutopilotBadge = findViewById(R.id.tv_autopilot_badge);
        fragmentContainer = findViewById(R.id.fragment_container);
        bottomNav = findViewById(R.id.bottom_navigation);

        updateHeader();

        bottomNav.setOnItemSelectedListener(item -> {
            int selectedTab = item.getItemId();
            if (selectedTab == currentTab && fragmentContainer.getChildCount() > 0) {
                refreshCurrentTab();
                return true;
            }
            currentTab = selectedTab;
            showTab(currentTab);
            return true;
        });

        showTab(R.id.nav_chat);

        String tutVal = db.getSettings().optString("tutorial_shown", "");
        boolean tutorialShown = "1".equals(tutVal) || "true".equalsIgnoreCase(tutVal) || db.getSettings().optBoolean("tutorial_shown", false);
        if (!tutorialShown) {
            showPremiumTutorialDialog();
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
        ContextCompat.startForegroundService(this, new Intent(this, ReplyForgeForegroundService.class));
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateHeader();
        refreshCurrentTab();
        handler.removeCallbacks(autoRefresher);
        handler.postDelayed(autoRefresher, 3000);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(autoRefresher);
    }

    private void updateHeader() {
        JSONObject s = db.getSettings();
        String storeName = s.optString("storeName", "Stickeria");
        tvMainStoreName.setText(storeName);
    }

    private void replaceJsonArray(JSONArray target, JSONArray source) {
        while (target.length() > 0) {
            target.remove(target.length() - 1);
        }
        if (source != null) {
            for (int i = 0; i < source.length(); i++) {
                target.put(source.opt(i));
            }
        }
    }

    private void refreshCurrentTab() {
        if (fragmentContainer == null || fragmentContainer.getChildCount() == 0) {
            showTab(currentTab);
            return;
        }

        View focused = getCurrentFocus();
        if (focused instanceof EditText && focused.hasFocus()) {
            return;
        }

        if (fragmentContainer.findFocus() instanceof EditText) {
            return;
        }

        View currentView = fragmentContainer.getChildAt(0);
        if (currentView == null) {
            return;
        }

        if (currentTab == R.id.nav_stock) {
            EditText etQuick = currentView.findViewById(R.id.et_quick_command);
            if (etQuick != null && etQuick.hasFocus()) {
                return;
            }
            refreshStockData(currentView);
        } else if (currentTab == R.id.nav_chat) {
            refreshChatData(currentView);
        } else if (currentTab == R.id.nav_orders) {
            refreshOrdersData(currentView);
        }
    }

    private void showTab(int tabId) {
        currentTab = tabId;
        fragmentContainer.removeAllViews();
        LayoutInflater inflater = LayoutInflater.from(this);

        if (tabId == R.id.nav_chat) {
            View v = inflater.inflate(R.layout.fragment_chat, fragmentContainer, false);
            setupChatView(v);
            fragmentContainer.addView(v);
        } else if (tabId == R.id.nav_stock) {
            View v = inflater.inflate(R.layout.fragment_stock, fragmentContainer, false);
            setupStockView(v);
            fragmentContainer.addView(v);
        } else if (tabId == R.id.nav_orders) {
            View v = inflater.inflate(R.layout.fragment_orders, fragmentContainer, false);
            setupOrdersView(v);
            fragmentContainer.addView(v);
        } else if (tabId == R.id.nav_settings) {
            View v = inflater.inflate(R.layout.fragment_settings, fragmentContainer, false);
            setupSettingsView(v);
            fragmentContainer.addView(v);
        }
    }

    private void setupChatView(View v) {
        RecyclerView rv = v.findViewById(R.id.rv_threads);
        if (rv.getLayoutManager() == null) {
            rv.setLayoutManager(new LinearLayoutManager(this));
        }
        if (chatAdapter == null || rv.getAdapter() != chatAdapter) {
            chatAdapter = new ThreadAdapter(chatThreadsData, (threadId, buyer, channel) -> {
                Intent it = new Intent(this, ChatDetailActivity.class);
                it.putExtra("thread_id", threadId);
                it.putExtra("buyer", buyer);
                it.putExtra("channel", channel);
                startActivity(it);
            });
            rv.setAdapter(chatAdapter);
        }
        refreshChatData(v);
    }

    private void refreshChatData(View v) {
        RecyclerView rv = v.findViewById(R.id.rv_threads);
        View empty = v.findViewById(R.id.layout_empty_chat);
        if (rv == null || empty == null) return;

        JSONArray threads = db.listThreads();
        replaceJsonArray(chatThreadsData, threads);
        if (chatThreadsData.length() == 0) {
            rv.setVisibility(View.GONE);
            empty.setVisibility(View.VISIBLE);
        } else {
            rv.setVisibility(View.VISIBLE);
            empty.setVisibility(View.GONE);
        }
        if (chatAdapter != null) {
            chatAdapter.notifyDataSetChanged();
        }
    }

    private void setupStockView(View v) {
        RecyclerView rv = v.findViewById(R.id.rv_products);
        View empty = v.findViewById(R.id.layout_empty_stock);
        Button btnAdd = v.findViewById(R.id.btn_add_product);
        Button btnDownloadTemplate = v.findViewById(R.id.btn_download_template);
        Button btnCsv = v.findViewById(R.id.btn_import_csv);
        EditText etQuick = v.findViewById(R.id.et_quick_command);
        Button btnQuickSend = v.findViewById(R.id.btn_quick_send);

        if (rv.getLayoutManager() == null) {
            rv.setLayoutManager(new LinearLayoutManager(this));
        }
        if (stockAdapter == null || rv.getAdapter() != stockAdapter) {
            stockAdapter = new ProductAdapter(stockProductsData, (sku, delta) -> {
                db.adjustStock(sku, delta);
                refreshStockData(v);
            });
            rv.setAdapter(stockAdapter);
        }
        refreshStockData(v);

        btnAdd.setOnClickListener(b -> showAddProductDialog());

        if (btnDownloadTemplate != null) {
            btnDownloadTemplate.setOnClickListener(b -> exportCatalogTemplate());
        }

        btnCsv.setOnClickListener(b -> {
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("*/*");
            startActivityForResult(intent, REQ_PICK_CSV);
        });

        btnQuickSend.setOnClickListener(b -> {
            String input = etQuick.getText().toString();
            if (input.trim().isEmpty()) {
                Toast.makeText(this, "Perintah masih kosong", Toast.LENGTH_SHORT).show();
                return;
            }
            QuickCommandParser.Result result = QuickCommandParser.execute(db, input);
            if (result.ok) {
                etQuick.setText("");
                Toast.makeText(this, result.message, Toast.LENGTH_SHORT).show();
                refreshStockData(v);
            } else if (result.candidates != null && !result.candidates.isEmpty()) {
                showQuickCommandCandidates(input, result);
            } else {
                Toast.makeText(this, result.message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void refreshStockData(View v) {
        RecyclerView rv = v.findViewById(R.id.rv_products);
        View empty = v.findViewById(R.id.layout_empty_stock);
        EditText etQuick = v.findViewById(R.id.et_quick_command);
        if (rv == null || empty == null) return;

        String savedText = etQuick != null ? etQuick.getText().toString() : null;
        int selStart = etQuick != null ? etQuick.getSelectionStart() : -1;
        int selEnd = etQuick != null ? etQuick.getSelectionEnd() : -1;

        JSONArray products = db.listProducts();
        replaceJsonArray(stockProductsData, products);
        if (stockProductsData.length() == 0) {
            rv.setVisibility(View.GONE);
            empty.setVisibility(View.VISIBLE);
        } else {
            rv.setVisibility(View.VISIBLE);
            empty.setVisibility(View.GONE);
        }
        if (stockAdapter != null) {
            stockAdapter.notifyDataSetChanged();
        }

        if (etQuick != null && savedText != null && !savedText.equals(etQuick.getText().toString())) {
            etQuick.setText(savedText);
            if (selStart >= 0 && selEnd >= 0 && selEnd <= savedText.length()) {
                etQuick.setSelection(selStart, selEnd);
            }
        }
    }

    private void showQuickCommandCandidates(String input, QuickCommandParser.Result result) {
        String[] labels = new String[result.candidates.size()];
        for (int i = 0; i < labels.length; i++) {
            String sku = result.candidates.get(i);
            JSONObject product = db.getProductBySku(sku);
            labels[i] = product != null ? sku + " - " + product.optString("name", "") : sku;
        }
        new AlertDialog.Builder(this)
                .setTitle("Pilih produk")
                .setItems(labels, (dialog, which) -> {
                    String sku = result.candidates.get(which);
                    QuickCommandParser.Result applied = QuickCommandParser.executeWithSku(db, input, sku);
                    Toast.makeText(this, applied.message,
                            applied.ok ? Toast.LENGTH_SHORT : Toast.LENGTH_LONG).show();
                    if (currentTab == R.id.nav_stock && fragmentContainer.getChildCount() > 0) {
                        View stockView = fragmentContainer.getChildAt(0);
                        EditText etQuick = stockView.findViewById(R.id.et_quick_command);
                        if (applied.ok && etQuick != null) {
                            etQuick.setText("");
                        }
                        refreshStockData(stockView);
                    } else {
                        showTab(R.id.nav_stock);
                    }
                })
                .setNegativeButton("Batal", null)
                .show();
    }

    private void showAddProductDialog() {
        View view = LayoutInflater.from(this).inflate(R.layout.dialog_add_product, null);
        EditText etSku = view.findViewById(R.id.et_new_sku);
        EditText etName = view.findViewById(R.id.et_new_name);
        EditText etPrice = view.findViewById(R.id.et_new_price);
        EditText etHpp = view.findViewById(R.id.et_new_hpp);
        EditText etStock = view.findViewById(R.id.et_new_stock);
        EditText etUnit = view.findViewById(R.id.et_new_unit);
        Button btnCancel = view.findViewById(R.id.btn_cancel_add);
        Button btnConfirm = view.findViewById(R.id.btn_confirm_add);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(view)
                .create();

        btnCancel.setOnClickListener(v -> dialog.dismiss());

        btnConfirm.setOnClickListener(v -> {
            String sku = etSku.getText().toString().trim();
            String name = etName.getText().toString().trim();
            int price = 0, hpp = 0, stock = 0;
            try { price = Integer.parseInt(etPrice.getText().toString().trim()); } catch (Exception ignored) {}
            try { hpp = Integer.parseInt(etHpp.getText().toString().trim()); } catch (Exception ignored) {}
            try { stock = Integer.parseInt(etStock.getText().toString().trim()); } catch (Exception ignored) {}
            String unit = etUnit.getText().toString().trim();

            if (name.isEmpty()) {
                Toast.makeText(this, "Nama produk tidak boleh kosong", Toast.LENGTH_SHORT).show();
                return;
            }
            if (sku.isEmpty()) {
                sku = "PRD-" + (System.currentTimeMillis() % 10000);
            }

            db.addProduct(sku, name, price, hpp, stock, unit);
            dialog.dismiss();
            Toast.makeText(this, "Produk " + name + " berhasil ditambahkan!", Toast.LENGTH_SHORT).show();
            showTab(R.id.nav_stock);
        });

        dialog.show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_PICK_CSV && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) {
                try {
                    String csvData = XlsxImporter.readToCsv(this, uri);
                    int count = db.importProductsFromCsv(csvData);
                    Toast.makeText(this, "Berhasil mengimpor " + count + " produk dari Excel/CSV!", Toast.LENGTH_SHORT).show();
                    showTab(R.id.nav_stock);
                } catch (Exception e) {
                    Toast.makeText(this, "Gagal membaca file: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            }
        }
    }

    private void setupOrdersView(View v) {
        RecyclerView rv = v.findViewById(R.id.rv_orders);
        com.google.android.material.chip.Chip btnAll = v.findViewById(R.id.btn_filter_all);
        com.google.android.material.chip.Chip btnPending = v.findViewById(R.id.btn_filter_pending);
        com.google.android.material.chip.Chip btnPaid = v.findViewById(R.id.btn_filter_paid);
        com.google.android.material.chip.Chip btnCancelled = v.findViewById(R.id.btn_filter_cancelled);
        com.google.android.material.chip.Chip btnShopeeLeads = v.findViewById(R.id.btn_filter_shopee_leads);

        if (rv.getLayoutManager() == null) {
            rv.setLayoutManager(new LinearLayoutManager(this));
        }

        View.OnClickListener filterListener = btn -> {
            if (btn == btnAll) orderFilter = "all";
            else if (btn == btnPending) orderFilter = "reserved";
            else if (btn == btnPaid) orderFilter = "paid";
            else if (btn == btnCancelled) orderFilter = "cancelled";
            else if (btn == btnShopeeLeads) orderFilter = "shopee_leads";
            refreshOrdersData(v);
        };

        if (btnAll != null) btnAll.setOnClickListener(filterListener);
        if (btnPending != null) btnPending.setOnClickListener(filterListener);
        if (btnPaid != null) btnPaid.setOnClickListener(filterListener);
        if (btnCancelled != null) btnCancelled.setOnClickListener(filterListener);
        if (btnShopeeLeads != null) btnShopeeLeads.setOnClickListener(filterListener);

        if (orderAdapter == null || rv.getAdapter() != orderAdapter) {
            orderAdapter = new OrderAdapter(ordersData, new OrderAdapter.OnOrderActionListener() {
                @Override
                public void onConfirmPaid(int orderId) {
                    if ("shopee_leads".equals(orderFilter)) {
                        JSONObject selected = null;
                        for (int i = 0; i < ordersData.length(); i++) {
                            JSONObject o = ordersData.optJSONObject(i);
                            if (o != null && o.optInt("id", -1) == orderId) {
                                selected = o;
                                break;
                            }
                        }
                        if (selected == null) return;
                        final String buyer = selected.optString("buyer", "");
                        final String threadId = selected.optString("thread_id", "");

                        JSONArray prods = db.listProducts();
                        if (prods.length() == 0) {
                            Toast.makeText(MainActivity.this, "Katalog produk kosong!", Toast.LENGTH_SHORT).show();
                            return;
                        }

                        List<String> productLabels = new ArrayList<>();
                        List<JSONObject> productList = new ArrayList<>();
                        for (int i = 0; i < prods.length(); i++) {
                            JSONObject p = prods.optJSONObject(i);
                            if (p != null) {
                                productList.add(p);
                                String name = p.optString("name", "Produk");
                                int price = p.optInt("price", 0);
                                productLabels.add(name + " - Rp" + String.format(Locale.GERMANY, "%,d", price));
                            }
                        }
                        if (productList.isEmpty()) return;

                        LinearLayout layout = new LinearLayout(MainActivity.this);
                        layout.setOrientation(LinearLayout.VERTICAL);
                        int pad = (int) (18 * getResources().getDisplayMetrics().density);
                        layout.setPadding(pad, pad, pad, pad);

                        TextView lblProduct = new TextView(MainActivity.this);
                        lblProduct.setText("Pilih Produk:");
                        lblProduct.setTextSize(13);
                        lblProduct.setTextColor(ContextCompat.getColor(MainActivity.this, R.color.text_primary));
                        layout.addView(lblProduct);

                        Spinner spinner = new Spinner(MainActivity.this);
                        ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(MainActivity.this, android.R.layout.simple_spinner_dropdown_item, productLabels);
                        spinner.setAdapter(spinnerAdapter);
                        layout.addView(spinner);

                        TextView lblQty = new TextView(MainActivity.this);
                        lblQty.setText("Jumlah Pack / Pcs:");
                        lblQty.setTextSize(13);
                        lblQty.setTextColor(ContextCompat.getColor(MainActivity.this, R.color.text_primary));
                        LinearLayout.LayoutParams qtyParams = new LinearLayout.LayoutParams(
                                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
                        qtyParams.topMargin = (int) (12 * getResources().getDisplayMetrics().density);
                        lblQty.setLayoutParams(qtyParams);
                        layout.addView(lblQty);

                        EditText input = new EditText(MainActivity.this);
                        input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
                        input.setText("1");
                        input.setSelection(1);
                        layout.addView(input);

                        new AlertDialog.Builder(MainActivity.this)
                                .setTitle("Konfirmasi Checkout Shopee")
                                .setView(layout)
                                .setPositiveButton("Konfirmasi", (dialog, which) -> {
                                    int chosenIdx = spinner.getSelectedItemPosition();
                                    if (chosenIdx < 0 || chosenIdx >= productList.size()) {
                                        chosenIdx = 0;
                                    }
                                    JSONObject chosen = productList.get(chosenIdx);
                                    String selectedSku = chosen.optString("sku", "");
                                    int unitPrice = chosen.optInt("price", 0);
                                    int stockLeft = chosen.optInt("stock", 0);

                                    String val = input.getText().toString().trim();
                                    int qty = 1;
                                    try {
                                        qty = Integer.parseInt(val);
                                    } catch (Exception ignored) {}
                                    if (qty <= 0) qty = 1;

                                    String targetThread = threadId.isEmpty() ? ("shopee:" + buyer) : threadId;

                                    JSONObject already = db.getLatestShopeeOrderForThread(targetThread, buyer);
                                    if (already != null) {
                                        Toast.makeText(MainActivity.this, "Lead ini sudah tercatat (" + already.optString("code", "-") + ").", Toast.LENGTH_LONG).show();
                                        refreshOrdersData(v);
                                        return;
                                    }
                                    if (qty > stockLeft) {
                                        Toast.makeText(MainActivity.this, "Stok tersisa " + stockLeft + ". Tidak dipotong.", Toast.LENGTH_LONG).show();
                                        return;
                                    }

                                    db.insertOrder(buyer, "shopee", selectedSku, qty, unitPrice, "paid",
                                            "Checkout Shopee diverifikasi seller", targetThread);
                                    db.setThreadPaused(targetThread, buyer, "shopee", true);
                                    Toast.makeText(MainActivity.this, "Pesanan Shopee berhasil diverifikasi & stok terpotong!", Toast.LENGTH_SHORT).show();
                                    refreshOrdersData(v);
                                })
                                .setNegativeButton("Batal", null)
                                .show();
                    } else {
                        db.updateOrderStatus(orderId, "paid");
                        Toast.makeText(MainActivity.this, "Pesanan LUNAS! Siap dikemas.", Toast.LENGTH_SHORT).show();
                        refreshOrdersData(v);
                    }
                }

                @Override
                public void onCancelOrder(int orderId) {
                    if ("shopee_leads".equals(orderFilter)) {
                        JSONObject selected = null;
                        for (int i = 0; i < ordersData.length(); i++) {
                            JSONObject o = ordersData.optJSONObject(i);
                            if (o != null && o.optInt("id", -1) == orderId) {
                                selected = o;
                                break;
                            }
                        }
                        if (selected != null) {
                            String threadId = selected.optString("thread_id", "");
                            String buyer = selected.optString("buyer", "");
                            if (threadId.isEmpty()) {
                                threadId = "shopee:" + buyer;
                            }
                            db.insertOrder(buyer, "shopee", "INQUIRY", 0, 0, "cancelled", "Calon pembeli batal / hanya bertanya", threadId);
                            db.setThreadPaused(threadId, buyer, "shopee", true);
                        }
                        Toast.makeText(MainActivity.this, "Calon pembeli Shopee dibatalkan.", Toast.LENGTH_SHORT).show();
                        refreshOrdersData(v);
                    } else {
                        db.updateOrderStatus(orderId, "cancelled");
                        Toast.makeText(MainActivity.this, "Pesanan DIBATALKAN. Stok dikembalikan.", Toast.LENGTH_SHORT).show();
                        refreshOrdersData(v);
                    }
                }
            });
            rv.setAdapter(orderAdapter);
        }

        refreshOrdersData(v);
    }

    private void refreshOrdersData(View v) {
        RecyclerView rv = v.findViewById(R.id.rv_orders);
        View empty = v.findViewById(R.id.layout_empty_orders);
        com.google.android.material.chip.Chip btnAll = v.findViewById(R.id.btn_filter_all);
        com.google.android.material.chip.Chip btnPending = v.findViewById(R.id.btn_filter_pending);
        com.google.android.material.chip.Chip btnPaid = v.findViewById(R.id.btn_filter_paid);
        com.google.android.material.chip.Chip btnCancelled = v.findViewById(R.id.btn_filter_cancelled);
        com.google.android.material.chip.Chip btnShopeeLeads = v.findViewById(R.id.btn_filter_shopee_leads);

        if (rv == null || empty == null) return;

        if (btnAll != null) btnAll.setChecked("all".equals(orderFilter));
        if (btnPending != null) btnPending.setChecked("reserved".equals(orderFilter));
        if (btnPaid != null) btnPaid.setChecked("paid".equals(orderFilter));
        if (btnCancelled != null) btnCancelled.setChecked("cancelled".equals(orderFilter));
        if (btnShopeeLeads != null) btnShopeeLeads.setChecked("shopee_leads".equals(orderFilter));

        JSONArray filtered = new JSONArray();
        if ("shopee_leads".equals(orderFilter)) {
            JSONArray prods = db.listProducts();
            String defaultItem = "[Inquiry Shopee]";
            int defaultTotal = 0;
            if (prods.length() > 0) {
                JSONObject fp = prods.optJSONObject(0);
                if (fp != null) {
                    defaultItem = "[1x " + fp.optString("name", "Produk") + "]";
                    defaultTotal = fp.optInt("price", 0);
                }
            }
            JSONArray threads = db.listThreads();
            for (int i = 0; i < threads.length(); i++) {
                try {
                    JSONObject t = threads.getJSONObject(i);
                    String channel = t.optString("channel", "");
                    if ("shopee".equalsIgnoreCase(channel)) {
                        if (t.optBoolean("paused", false)) continue;
                        String buyer = t.optString("buyer", "");
                        String threadId = t.optString("id", "");
                        // A lead that already produced a Shopee order is resolved, never a lead again.
                        JSONObject existing = db.getLatestShopeeOrderForThread(threadId, buyer);
                        if (existing != null) {
                            String st = existing.optString("status", "");
                            if ("paid".equalsIgnoreCase(st) || "cancelled".equalsIgnoreCase(st)) continue;
                        }
                        JSONObject lead = new JSONObject();
                        // Stable synthetic id (never collides with real order ids).
                        lead.put("id", ("lead:" + threadId).hashCode() & 0x7fffffff);
                        lead.put("code", "LEAD-" + buyer);
                        lead.put("buyer", buyer);
                        lead.put("channel", "shopee");
                        lead.put("status", "lead");
                        lead.put("items", defaultItem);
                        lead.put("total", defaultTotal);
                        lead.put("thread_id", threadId);
                        filtered.put(lead);
                    }
                } catch (Exception ignored) {}
            }
        } else {
            JSONArray all = db.listOrders();
            for (int i = 0; i < all.length(); i++) {
                try {
                    JSONObject o = all.getJSONObject(i);
                    String st = o.optString("status", "");
                    if ("all".equals(orderFilter) || st.equalsIgnoreCase(orderFilter)) {
                        filtered.put(o);
                    }
                } catch (Exception ignored) {}
            }
        }

        replaceJsonArray(ordersData, filtered);
        if (ordersData.length() == 0) {
            rv.setVisibility(View.GONE);
            empty.setVisibility(View.VISIBLE);
        } else {
            rv.setVisibility(View.VISIBLE);
            empty.setVisibility(View.GONE);
        }
        if (orderAdapter != null) {
            orderAdapter.notifyDataSetChanged();
        }
    }

    private void setupSettingsView(View v) {
        EditText etName = v.findViewById(R.id.et_set_store_name);
        EditText etBank = v.findViewById(R.id.et_set_bank_account);
        EditText etCutoff = v.findViewById(R.id.et_set_cutoff);
        EditText etCity = v.findViewById(R.id.et_set_city);
        EditText etApiKey = v.findViewById(R.id.et_set_api_key);
        Button btnSave = v.findViewById(R.id.btn_save_settings);
        Button btnReloadDemo = v.findViewById(R.id.btn_reload_demo);
        Button btnReset = v.findViewById(R.id.btn_reset_all_data);
        Button btnTutorial = v.findViewById(R.id.btn_show_tutorial);

        JSONObject s = db.getSettings();
        etName.setText(s.optString("storeName", "Stickeria"));
        etBank.setText(s.optString("bankAccount", "SeaBank 901483182051 a.n. Ferdinand Manurung"));
        etCutoff.setText(s.optString("cutoff", "16.00"));
        if (etCity != null) {
            etCity.setText(s.optString("storeCity", "Bandung"));
        }
        if (etApiKey != null) {
            String key = s.optString("apiKey", "");
            etApiKey.setText(key);
            etApiKey.setHint(key.isEmpty()
                    ? "Kosong = mesin AI lokal 100% offline (tanpa kuota)"
                    : "Kunci tersimpan di perangkat");
        }

        if (btnTutorial != null) {
            btnTutorial.setOnClickListener(b -> showPremiumTutorialDialog());
        }

        btnSave.setOnClickListener(b -> {
            String name = etName.getText().toString().trim();
            String bank = etBank.getText().toString().trim();
            String cutoff = etCutoff.getText().toString().trim();
            String city = etCity != null ? etCity.getText().toString().trim() : "Bandung";
            if (city.isEmpty()) city = "Bandung";

            db.setSetting("storeName", name);
            db.setSetting("bankAccount", bank);
            db.setSetting("cutoff", cutoff);
            db.setSetting("storeCity", city);
            if (etApiKey != null) {
                db.setSetting("apiKey", etApiKey.getText().toString().trim());
            }
            updateHeader();
            Toast.makeText(this, "Pengaturan toko berhasil disimpan!", Toast.LENGTH_SHORT).show();
        });

        btnReloadDemo.setOnClickListener(b -> {
            db.seedDemoStickeria();
            updateHeader();
            Toast.makeText(this, "Profil demo Stickeria berhasil dimuat ulang!", Toast.LENGTH_SHORT).show();
            showTab(R.id.nav_stock);
        });

        btnReset.setOnClickListener(b -> {
            db.resetAllData();
            Toast.makeText(this, "Semua riwayat chat dan transaksi telah dibersihkan.", Toast.LENGTH_SHORT).show();
            showTab(R.id.nav_orders);
        });
    }

    private void exportCatalogTemplate() {
        String csvContent = "SKU,Nama,Harga,HPP,Stok,Satuan\n" +
                "STK-CAT-01,Paket Stiker Kucing Gemoy,15000,6000,50,pack\n" +
                "STK-DOG-01,Paket Stiker Shiba Inu Gemoy,15000,6000,30,pack\n";

        File targetXlsx = null;
        File targetCsv = null;

        File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (downloadsDir == null || (!downloadsDir.exists() && !downloadsDir.mkdirs())) {
            downloadsDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (downloadsDir == null) {
                downloadsDir = getFilesDir();
            }
        }

        try {
            File xlsxFile = new File(downloadsDir, "template-katalog-stickeria.xlsx");
            try (InputStream is = getAssets().open("template-katalog-toko.xlsx");
                 FileOutputStream fos = new FileOutputStream(xlsxFile)) {
                byte[] buf = new byte[4096];
                int len;
                while ((len = is.read(buf)) > 0) {
                    fos.write(buf, 0, len);
                }
                fos.flush();
                targetXlsx = xlsxFile;
            }
        } catch (Exception ignored) {}

        try {
            File csvFile = new File(downloadsDir, "template-katalog-stickeria.csv");
            try (FileOutputStream fos = new FileOutputStream(csvFile)) {
                fos.write(csvContent.getBytes(StandardCharsets.UTF_8));
                fos.flush();
                targetCsv = csvFile;
            }
        } catch (Exception ignored) {}

        if (targetXlsx != null || targetCsv != null) {
            java.util.List<String> paths = new java.util.ArrayList<>();
            if (targetXlsx != null) paths.add(targetXlsx.getAbsolutePath());
            if (targetCsv != null) paths.add(targetCsv.getAbsolutePath());
            try {
                android.media.MediaScannerConnection.scanFile(this, paths.toArray(new String[0]), null, null);
            } catch (Throwable ignored) {}
            Toast.makeText(this, "Template Excel (.xlsx) & CSV berhasil disimpan di folder Download!", Toast.LENGTH_LONG).show();
        } else {
            Toast.makeText(this, "Gagal mengunduh template Excel/CSV", Toast.LENGTH_SHORT).show();
        }
    }

    private void showPremiumTutorialDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_tutorial, null);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create();

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        Button btnAction = dialogView.findViewById(R.id.btn_tutorial_action);
        if (btnAction != null) {
            btnAction.setOnClickListener(v -> {
                db.setSetting("tutorial_shown", "1");
                dialog.dismiss();
            });
        }

        dialog.show();
    }

    private void showTutorialDialog() {
        showPremiumTutorialDialog();
    }
}
