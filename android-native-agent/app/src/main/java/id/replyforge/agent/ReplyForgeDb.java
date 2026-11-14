package id.replyforge.agent;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Native Android SQLite Database Helper for ReplyForge Standalone.
 * Manages products, orders, chat messages, threads, anomaly alerts, store accounts, and settings.
 * 100% On-Device, zero laptop dependency.
 */
public class ReplyForgeDb extends SQLiteOpenHelper {

    private static final String TAG = "ReplyForgeDb";
    private static final String DATABASE_NAME = "replyforge_standalone.db";
    private static final int DATABASE_VERSION = 3;

    private static ReplyForgeDb instance;

    public static synchronized ReplyForgeDb getInstance(Context context) {
        if (instance == null) {
            instance = new ReplyForgeDb(context.getApplicationContext());
        }
        return instance;
    }

    private ReplyForgeDb(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS products (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "sku TEXT UNIQUE NOT NULL, " +
                "name TEXT NOT NULL, " +
                "aliases TEXT NOT NULL DEFAULT '[]', " +
                "unit TEXT NOT NULL DEFAULT 'pcs', " +
                "price INTEGER NOT NULL, " +
                "hpp INTEGER NOT NULL, " +
                "stock INTEGER NOT NULL, " +
                "capacity INTEGER NOT NULL DEFAULT 100, " +
                "max_order_normal INTEGER NOT NULL DEFAULT 15, " +
                "updated_at INTEGER NOT NULL)");

        db.execSQL("CREATE TABLE IF NOT EXISTS orders (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "code TEXT UNIQUE NOT NULL, " +
                "buyer TEXT NOT NULL, " +
                "channel TEXT NOT NULL DEFAULT 'whatsapp', " +
                "thread_id TEXT NOT NULL DEFAULT '', " +
                "items TEXT NOT NULL DEFAULT '[]', " +
                "total INTEGER NOT NULL, " +
                "status TEXT NOT NULL DEFAULT 'reserved', " +
                "source TEXT NOT NULL DEFAULT 'chat', " +
                "missing_fields TEXT NOT NULL DEFAULT '[]', " +
                "address_note TEXT NOT NULL DEFAULT '', " +
                "created_at INTEGER NOT NULL)");

        db.execSQL("CREATE TABLE IF NOT EXISTS messages (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "thread_id TEXT NOT NULL, " +
                "buyer TEXT NOT NULL, " +
                "channel TEXT NOT NULL DEFAULT 'whatsapp', " +
                "direction TEXT NOT NULL, " +
                "text TEXT NOT NULL, " +
                "created_at INTEGER NOT NULL)");

        db.execSQL("CREATE TABLE IF NOT EXISTS threads (" +
                "id TEXT PRIMARY KEY, " +
                "buyer TEXT NOT NULL, " +
                "channel TEXT NOT NULL DEFAULT 'whatsapp', " +
                "paused INTEGER NOT NULL DEFAULT 0, " +
                "last_at INTEGER NOT NULL)");

        db.execSQL("CREATE TABLE IF NOT EXISTS store_accounts (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "email TEXT NOT NULL, " +
                "phone TEXT NOT NULL, " +
                "owner_name TEXT NOT NULL, " +
                "store_name TEXT NOT NULL, " +
                "category TEXT NOT NULL, " +
                "shopee_handle TEXT NOT NULL, " +
                "whatsapp_number TEXT NOT NULL, " +
                "bank_account TEXT NOT NULL, " +
                "shopee_connected INTEGER NOT NULL DEFAULT 0, " +
                "whatsapp_connected INTEGER NOT NULL DEFAULT 1, " +
                "os_notification_granted INTEGER NOT NULL DEFAULT 1, " +
                "onboarding_completed INTEGER NOT NULL DEFAULT 1, " +
                "created_at INTEGER NOT NULL)");

        db.execSQL("CREATE TABLE IF NOT EXISTS settings (" +
                "key TEXT PRIMARY KEY, " +
                "value TEXT NOT NULL)");

        db.execSQL("CREATE TABLE IF NOT EXISTS anomaly_alerts (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "thread_id TEXT NOT NULL, " +
                "buyer TEXT NOT NULL, " +
                "channel TEXT NOT NULL DEFAULT 'whatsapp', " +
                "kind TEXT NOT NULL, " +
                "severity TEXT NOT NULL DEFAULT 'high', " +
                "title TEXT NOT NULL, " +
                "reason TEXT NOT NULL, " +
                "message_text TEXT NOT NULL, " +
                "requested_qty INTEGER NOT NULL DEFAULT 0, " +
                "sku TEXT, " +
                "status TEXT NOT NULL DEFAULT 'open', " +
                "created_at INTEGER NOT NULL)");

        db.execSQL("CREATE TABLE IF NOT EXISTS rules (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "name TEXT NOT NULL, " +
                "triggers TEXT NOT NULL, " +
                "response TEXT NOT NULL, " +
                "enabled INTEGER NOT NULL DEFAULT 1, " +
                "source TEXT NOT NULL DEFAULT 'seed', " +
                "created_at INTEGER NOT NULL)");

        seedDefaults(db);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            db.execSQL("DELETE FROM products WHERE sku != 'STK-CAT-01'");
            db.execSQL("UPDATE settings SET value = 'Stickeria' WHERE key = 'storeName'");
            db.execSQL("UPDATE settings SET value = 'SeaBank 901483182051 a.n. Ferdinand Manurung' WHERE key = 'bankAccount'");
        }
        if (oldVersion < 3) {
            try {
                db.execSQL("ALTER TABLE orders ADD COLUMN thread_id TEXT NOT NULL DEFAULT ''");
            } catch (Exception ignored) {}
        }
    }

    private void seedDefaults(SQLiteDatabase db) {
        long now = System.currentTimeMillis();

        // 1. Seed Official Stickeria 1 Single Product
        insertProduct(db, "STK-CAT-01", "Paket Stiker Kucing Gemoy Vinyl Waterproof Lucu Anti Air Die Cut Isi 20 Pcs",
                "[\"paket stiker kucing gemoy\",\"stiker kucing gemoy\",\"stiker kucing\",\"sticker kucing\",\"stiker vinyl\",\"stiker gemoy\",\"stiker\",\"sticker\",\"sticker cat\",\"kucing\"]",
                "pack", 15000, 6000, 50, 100, 15, now);

        // 2. Seed Store Account (Stickeria)
        ContentValues acc = new ContentValues();
        acc.put("email", "ferdinandmanurung899@gmail.com");
        acc.put("phone", "085183250750");
        acc.put("owner_name", "Lina Permata");
        acc.put("store_name", "Stickeria");
        acc.put("category", "Stiker & Aksesoris Kreatif");
        acc.put("shopee_handle", "@royaldinan");
        acc.put("whatsapp_number", "0851-8325-0750");
        acc.put("bank_account", "SeaBank 901483182051 a.n. Ferdinand Manurung");
        acc.put("shopee_connected", 1);
        acc.put("whatsapp_connected", 1);
        acc.put("os_notification_granted", 1);
        acc.put("onboarding_completed", 1);
        acc.put("created_at", now);
        db.insert("store_accounts", null, acc);

        // 3. Seed Settings
        setSettingInternal(db, "storeName", "Stickeria");
        setSettingInternal(db, "ownerName", "Lina Permata");
        setSettingInternal(db, "cutoff", "16.00");
        setSettingInternal(db, "bankAccount", "SeaBank 901483182051 a.n. Ferdinand Manurung");
        setSettingInternal(db, "tone", "santai");
        setSettingInternal(db, "mode", "autopilot");
        setSettingInternal(db, "model", "gemini-3.8-flash");
        setSettingInternal(db, "baseUrl", "https://generativelanguage.googleapis.com/v1beta/openai");
        // Kredensial cloud TIDAK di-hardcode (Guidebook: wajib environment variable / input pengguna).
        // Kosong = mesin AI lokal on-device yang dipakai (100% offline, tanpa kuota).
        setSettingInternal(db, "apiKey", "");

        // 4. Seed Rules
        insertRuleInternal(db, "Jadwal Kirim & Cutoff Hari Ini", "[\"kirim\",\"pengiriman\",\"dikirim\",\"ongkir\",\"kurir\",\"jam cutoff\",\"hari ini\",\"kapan dikirim\",\"jam berapa kirim\",\"nyampe\",\"sampe\"]",
                "Siap kak! Kalau pesanan masuk sebelum jam 16.00 sore ini, langsung kita ikutkan pengiriman hari ini juga ya 🚚 (JNE, J&T, SiCepat, Shopee Xpress)", 1, "seed", now);
        insertRuleInternal(db, "Nego Harga & Grosir (HPP Guard)", "[\"nego\",\"kurang\",\"diskon\",\"potongan\",\"murah\",\"harga pas\",\"kurangin\",\"tawar\",\"boleh kurang\"]",
                "Wah maaf banget kak, untuk stiker kucing udah harga pas terbaik di Rp15.000 ya kak 🙏 Ambil minimal 3 pack baru bisa dapat potongan grosir kak!", 1, "seed", now);
        insertRuleInternal(db, "Info Pembayaran & Rekening", "[\"bayar\",\"transfer\",\"rekening\",\"cod\",\"qris\",\"pembayaran\"]",
                "Untuk pembayaran Shopee bisa langsung lewat aplikasi kak (ShopeePay, SPayLater, COD). Untuk WhatsApp bisa transfer SeaBank 901483182051 a.n. Ferdinand Manurung ya kak ✅", 1, "seed", now);
    }

    private void insertRuleInternal(SQLiteDatabase db, String name, String triggers, String response, int enabled, String source, long now) {
        ContentValues cv = new ContentValues();
        cv.put("name", name);
        cv.put("triggers", triggers);
        cv.put("response", response);
        cv.put("enabled", enabled);
        cv.put("source", source);
        cv.put("created_at", now);
        db.insert("rules", null, cv);
    }

    private void insertProduct(SQLiteDatabase db, String sku, String name, String aliases, String unit, int price, int hpp, int stock, int cap, int maxOrder, long now) {
        ContentValues cv = new ContentValues();
        cv.put("sku", sku);
        cv.put("name", name);
        cv.put("aliases", aliases);
        cv.put("unit", unit);
        cv.put("price", price);
        cv.put("hpp", hpp);
        cv.put("stock", stock);
        cv.put("capacity", cap);
        cv.put("max_order_normal", maxOrder);
        cv.put("updated_at", now);
        db.insertWithOnConflict("products", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    private void setSettingInternal(SQLiteDatabase db, String key, String val) {
        ContentValues cv = new ContentValues();
        cv.put("key", key);
        cv.put("value", val);
        db.insertWithOnConflict("settings", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    // ==========================================
    // Public Data Access Methods
    // ==========================================

    public synchronized JSONArray listProducts() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, sku, name, aliases, unit, price, hpp, stock, capacity, max_order_normal FROM products ORDER BY id ASC", null)) {
            while (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("sku", c.getString(1));
                o.put("name", c.getString(2));
                o.put("aliases", new JSONArray(c.getString(3)));
                o.put("unit", c.getString(4));
                o.put("price", c.getInt(5));
                o.put("hpp", c.getInt(6));
                o.put("stock", c.getInt(7));
                o.put("capacity", c.getInt(8));
                o.put("max_order_normal", c.getInt(9));
                arr.put(o);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error listing products", e);
        }
        return arr;
    }

    public synchronized JSONObject adjustStock(String sku, int delta) {
        SQLiteDatabase db = getWritableDatabase();
        try (Cursor c = db.rawQuery("SELECT stock, capacity FROM products WHERE sku = ?", new String[]{sku})) {
            if (c.moveToNext()) {
                int current = c.getInt(0);
                int cap = c.getInt(1);
                int next = Math.max(0, Math.min(cap, current + delta));
                ContentValues cv = new ContentValues();
                cv.put("stock", next);
                cv.put("updated_at", System.currentTimeMillis());
                db.update("products", cv, "sku = ?", new String[]{sku});
            }
        } catch (Exception e) {
            Log.e(TAG, "Error adjusting stock", e);
        }
        return getProductBySku(sku);
    }

    public synchronized JSONObject getProductBySku(String sku) {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, sku, name, aliases, unit, price, hpp, stock, capacity, max_order_normal FROM products WHERE sku = ?", new String[]{sku})) {
            if (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("sku", c.getString(1));
                o.put("name", c.getString(2));
                o.put("aliases", new JSONArray(c.getString(3)));
                o.put("unit", c.getString(4));
                o.put("price", c.getInt(5));
                o.put("hpp", c.getInt(6));
                o.put("stock", c.getInt(7));
                o.put("capacity", c.getInt(8));
                o.put("max_order_normal", c.getInt(9));
                return o;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getProductBySku", e);
        }
        return null;
    }

    public synchronized int importProductsFromCsv(String csvData) {
        if (csvData == null || csvData.trim().isEmpty()) return 0;
        SQLiteDatabase db = getWritableDatabase();
        String[] lines = csvData.trim().split("\r?\n");
        if (lines.length < 2) return 0;

        java.util.List<String> headers = parseCsvLine(lines[0]);
        int idxSku = -1, idxName = -1, idxPrice = -1, idxHpp = -1, idxStock = -1, idxUnit = -1;

        for (int i = 0; i < headers.size(); i++) {
            String h = headers.get(i).toLowerCase(java.util.Locale.ROOT).trim();
            if (h.contains("sku") || h.contains("kode")) idxSku = i;
            else if (h.contains("nama") || h.contains("name") || h.contains("produk") || h.contains("barang")) idxName = i;
            else if (h.contains("harga") || h.contains("price") || h.contains("jual")) idxPrice = i;
            else if (h.contains("hpp") || h.contains("modal")) idxHpp = i;
            else if (h.contains("stok") || h.contains("stock") || h.contains("qty")) idxStock = i;
            else if (h.contains("unit") || h.contains("satuan")) idxUnit = i;
        }

        // Positional defaults if headers weren't named standardly
        if (idxName == -1 && headers.size() > 1) idxName = 1;
        if (idxPrice == -1 && headers.size() > 2) idxPrice = 2;
        if (idxHpp == -1 && headers.size() > 3) idxHpp = 3;
        if (idxStock == -1 && headers.size() > 4) idxStock = 4;
        if (idxUnit == -1 && headers.size() > 5) idxUnit = 5;

        long now = System.currentTimeMillis();
        int importedCount = 0;

        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            java.util.List<String> cols = parseCsvLine(line);
            if (cols.isEmpty()) continue;

            String name = (idxName >= 0 && idxName < cols.size()) ? cols.get(idxName).trim() : "";
            if (name.isEmpty()) continue;

            String sku = (idxSku >= 0 && idxSku < cols.size()) ? cols.get(idxSku).trim() : "";
            if (sku.isEmpty()) {
                sku = "PRD-" + (1000 + i);
            }

            int price = 0;
            if (idxPrice >= 0 && idxPrice < cols.size()) {
                price = parseNumeric(cols.get(idxPrice));
            }
            int hpp = 0;
            if (idxHpp >= 0 && idxHpp < cols.size()) {
                hpp = parseNumeric(cols.get(idxHpp));
            }
            if (hpp == 0 && price > 0) {
                hpp = (int) Math.round(price * 0.7);
            }
            int stock = 0;
            if (idxStock >= 0 && idxStock < cols.size()) {
                stock = parseNumeric(cols.get(idxStock));
            }
            String unit = (idxUnit >= 0 && idxUnit < cols.size()) ? cols.get(idxUnit).trim().toLowerCase(java.util.Locale.ROOT) : "pcs";
            if (unit.isEmpty()) unit = "pcs";

            JSONArray aliases = new JSONArray();
            aliases.put(name.toLowerCase(java.util.Locale.ROOT));
            String[] nameParts = name.split("\\s+");
            if (nameParts.length > 0 && !nameParts[0].isEmpty()) {
                aliases.put(nameParts[0].toLowerCase(java.util.Locale.ROOT));
            }
            if (nameParts.length > 1) {
                aliases.put((nameParts[0] + " " + nameParts[1]).toLowerCase(java.util.Locale.ROOT));
            }

            int cap = Math.max(stock * 2, 50);
            insertProduct(db, sku, name, aliases.toString(), unit, price, hpp, stock, cap, 15, now);
            importedCount++;
        }
        return importedCount;
    }

    private static java.util.List<String> parseCsvLine(String line) {
        java.util.List<String> result = new java.util.ArrayList<>();
        if (line == null) return result;
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    cur.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(cur.toString().trim().replaceAll("^\"|\"$", ""));
                cur.setLength(0);
            } else {
                cur.append(c);
            }
        }
        result.add(cur.toString().trim().replaceAll("^\"|\"$", ""));
        return result;
    }

    private static int parseNumeric(String s) {
        if (s == null) return 0;
        String clean = s.replaceAll("[^0-9]", "");
        if (clean.isEmpty()) return 0;
        try {
            return Integer.parseInt(clean);
        } catch (Exception e) {
            return 0;
        }
    }

    public synchronized JSONObject insertOrder(String buyer, String channel, String sku, int qty, int price, String status, String note) {
        return insertOrder(buyer, channel, sku, qty, price, status, note, null);
    }

    public synchronized JSONObject insertOrder(String buyer, String channel, String sku, int qty, int price, String status, String note, String threadId) {
        SQLiteDatabase db = getWritableDatabase();
        long now = System.currentTimeMillis();
        String code = "RF-" + new java.text.SimpleDateFormat("yyMMdd", java.util.Locale.ROOT).format(new java.util.Date(now)) + "-" + String.format(java.util.Locale.ROOT, "%04d", (int)(Math.random()*9000)+1000);
        ContentValues cv = new ContentValues();
        cv.put("code", code);
        cv.put("buyer", buyer);
        cv.put("channel", channel);
        cv.put("thread_id", threadId != null ? threadId : "");
        cv.put("items", "[{\"sku\":\"" + sku + "\",\"quantity\":" + qty + ",\"price\":" + price + "}]");
        cv.put("total", qty * price);
        cv.put("status", status); // 'reserved', 'paid', 'cancelled'
        cv.put("source", "chat");
        cv.put("address_note", note != null ? note : "");
        cv.put("created_at", now);
        long id = db.insert("orders", null, cv);
        adjustStock(sku, -qty); // Potong stok otomatis
        return getOrderById((int) id);
    }

    public synchronized JSONArray listOrders() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, code, buyer, channel, items, total, status, source, missing_fields, address_note, created_at, thread_id FROM orders ORDER BY id DESC", null)) {
            while (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("code", c.getString(1));
                o.put("buyer", c.getString(2));
                o.put("channel", c.getString(3));
                o.put("items", new JSONArray(c.getString(4)));
                o.put("total", c.getInt(5));
                o.put("status", c.getString(6));
                o.put("source", c.getString(7));
                o.put("missing_fields", new JSONArray(c.getString(8)));
                o.put("address_note", c.getString(9));
                o.put("created_at", c.getLong(10));
                o.put("thread_id", c.getString(11));
                arr.put(o);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error listing orders", e);
        }
        return arr;
    }

    public synchronized JSONObject updateOrderStatus(int id, String status) {
        SQLiteDatabase db = getWritableDatabase();
        try (Cursor c = db.rawQuery("SELECT status, items FROM orders WHERE id = ?", new String[]{String.valueOf(id)})) {
            if (c.moveToNext()) {
                String prevStatus = c.getString(0);
                String itemsJson = c.getString(1);

                // If cancelling, restore stock
                if ("cancelled".equalsIgnoreCase(status) && !"cancelled".equalsIgnoreCase(prevStatus)) {
                    JSONArray items = new JSONArray(itemsJson);
                    for (int i = 0; i < items.length(); i++) {
                        JSONObject it = items.getJSONObject(i);
                        adjustStock(it.getString("sku"), it.getInt("quantity"));
                    }
                }

                ContentValues cv = new ContentValues();
                cv.put("status", status);
                db.update("orders", cv, "id = ?", new String[]{String.valueOf(id)});
            }
        } catch (Exception e) {
            Log.e(TAG, "Error updating order status", e);
        }
        return getOrderById(id);
    }

    public synchronized JSONObject getOrderById(int id) {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, code, buyer, channel, items, total, status, source, missing_fields, address_note, created_at, thread_id FROM orders WHERE id = ?", new String[]{String.valueOf(id)})) {
            if (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("code", c.getString(1));
                o.put("buyer", c.getString(2));
                o.put("channel", c.getString(3));
                o.put("items", new JSONArray(c.getString(4)));
                o.put("total", c.getInt(5));
                o.put("status", c.getString(6));
                o.put("source", c.getString(7));
                o.put("missing_fields", new JSONArray(c.getString(8)));
                o.put("address_note", c.getString(9));
                o.put("created_at", c.getLong(10));
                o.put("thread_id", c.getString(11));
                return o;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getOrderById", e);
        }
        return null;
    }

    public synchronized long insertMessage(String threadId, String buyer, String channel, String direction, String text) {
        SQLiteDatabase db = getWritableDatabase();
        long now = System.currentTimeMillis();

        ContentValues cv = new ContentValues();
        cv.put("thread_id", threadId);
        cv.put("buyer", buyer);
        cv.put("channel", channel);
        cv.put("direction", direction);
        cv.put("text", text);
        cv.put("created_at", now);
        long id = db.insert("messages", null, cv);

        // Update thread record
        ContentValues tc = new ContentValues();
        tc.put("id", threadId);
        tc.put("buyer", buyer);
        tc.put("channel", channel);
        tc.put("last_at", now);
        db.insertWithOnConflict("threads", null, tc, SQLiteDatabase.CONFLICT_IGNORE);
        db.update("threads", tc, "id = ?", new String[]{threadId});

        return id;
    }

    public synchronized JSONArray listMessages() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, thread_id, buyer, channel, direction, text, created_at FROM messages ORDER BY id ASC", null)) {
            while (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("thread_id", c.getString(1));
                o.put("buyer", c.getString(2));
                o.put("channel", c.getString(3));
                o.put("direction", c.getString(4));
                o.put("text", c.getString(5));
                o.put("created_at", c.getLong(6));
                arr.put(o);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error listing messages", e);
        }
        return arr;
    }

    public synchronized JSONArray getRecentThreadMessages(String threadId, int limit) {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        String sql = "SELECT direction, text, created_at FROM (SELECT direction, text, created_at, id FROM messages WHERE thread_id = ? ORDER BY id DESC LIMIT ?) ORDER BY id ASC";
        try (Cursor c = db.rawQuery(sql, new String[]{threadId, String.valueOf(limit)})) {
            while (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("direction", c.getString(0));
                o.put("text", c.getString(1));
                o.put("created_at", c.getLong(2));
                arr.put(o);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting recent thread messages", e);
        }
        return arr;
    }

    public synchronized JSONArray listThreads() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, buyer, channel, paused, last_at FROM threads ORDER BY last_at DESC", null)) {
            while (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getString(0));
                o.put("buyer", c.getString(1));
                o.put("channel", c.getString(2));
                o.put("paused", c.getInt(3) == 1);
                o.put("last_at", c.getLong(4));
                arr.put(o);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error listing threads", e);
        }
        return arr;
    }

    public synchronized boolean isThreadPaused(String threadId) {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT paused FROM threads WHERE id = ?", new String[]{threadId})) {
            if (c.moveToNext()) {
                return c.getInt(0) == 1;
            }
        } catch (Exception ignored) {}
        return false;
    }

    public synchronized void setThreadPaused(String threadId, String buyer, String channel, boolean paused) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("id", threadId);
        cv.put("buyer", buyer);
        cv.put("channel", channel);
        cv.put("paused", paused ? 1 : 0);
        cv.put("last_at", System.currentTimeMillis());
        db.insertWithOnConflict("threads", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public synchronized void addAlert(String threadId, String buyer, String channel, String kind, String severity, String title, String reason, String msgText, int requestedQty, String sku) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("thread_id", threadId);
        cv.put("buyer", buyer);
        cv.put("channel", channel);
        cv.put("kind", kind);
        cv.put("severity", severity);
        cv.put("title", title);
        cv.put("reason", reason);
        cv.put("message_text", msgText);
        cv.put("requested_qty", requestedQty);
        cv.put("sku", sku);
        cv.put("status", "open");
        cv.put("created_at", System.currentTimeMillis());
        db.insert("anomaly_alerts", null, cv);
    }

    public synchronized JSONArray listAlerts() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, thread_id, buyer, channel, kind, severity, title, reason, message_text, requested_qty, sku, status, created_at FROM anomaly_alerts ORDER BY id DESC", null)) {
            while (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("thread_id", c.getString(1));
                o.put("buyer", c.getString(2));
                o.put("channel", c.getString(3));
                o.put("kind", c.getString(4));
                o.put("severity", c.getString(5));
                o.put("title", c.getString(6));
                o.put("reason", c.getString(7));
                o.put("message_text", c.getString(8));
                o.put("requested_qty", c.getInt(9));
                o.put("sku", c.getString(10));
                o.put("status", c.getString(11));
                o.put("created_at", c.getLong(12));
                arr.put(o);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error listing alerts", e);
        }
        return arr;
    }

    public synchronized void resolveAlert(int id, boolean resumeAi) {
        SQLiteDatabase db = getWritableDatabase();
        String threadId = null;
        try (Cursor c = db.rawQuery("SELECT thread_id FROM anomaly_alerts WHERE id = ?", new String[]{String.valueOf(id)})) {
            if (c.moveToNext()) {
                threadId = c.getString(0);
            }
        } catch (Exception ignored) {}

        ContentValues cv = new ContentValues();
        cv.put("status", "resolved");
        db.update("anomaly_alerts", cv, "id = ?", new String[]{String.valueOf(id)});

        if (resumeAi && threadId != null) {
            ContentValues tc = new ContentValues();
            tc.put("paused", 0);
            db.update("threads", tc, "id = ?", new String[]{threadId});
        }
    }

    public synchronized JSONObject getSettings() {
        JSONObject o = new JSONObject();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT key, value FROM settings", null)) {
            while (c.moveToNext()) {
                o.put(c.getString(0), c.getString(1));
            }
        } catch (Exception ignored) {}
        return o;
    }

    public synchronized void updateSettings(JSONObject patch) {
        SQLiteDatabase db = getWritableDatabase();
        try {
            JSONArray names = patch.names();
            if (names != null) {
                for (int i = 0; i < names.length(); i++) {
                    String k = names.getString(i);
                    String v = patch.getString(k);
                    setSettingInternal(db, k, v);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error updating settings", e);
        }
    }

    public synchronized JSONObject getStoreAccount() {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, email, phone, owner_name, store_name, category, shopee_handle, whatsapp_number, bank_account, shopee_connected, whatsapp_connected, os_notification_granted, onboarding_completed, created_at FROM store_accounts LIMIT 1", null)) {
            if (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("email", c.getString(1));
                o.put("phone", c.getString(2));
                o.put("ownerName", c.getString(3));
                o.put("storeName", c.getString(4));
                o.put("category", c.getString(5));
                o.put("shopeeHandle", c.getString(6));
                o.put("whatsappNumber", c.getString(7));
                o.put("bankAccount", c.getString(8));
                o.put("shopeeConnected", c.getInt(9) == 1);
                o.put("whatsappConnected", c.getInt(10) == 1);
                o.put("osNotificationGranted", c.getInt(11) == 1);
                o.put("onboardingCompleted", c.getInt(12) == 1);
                o.put("created_at", c.getLong(13));
                return o;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting store account", e);
        }
        return null;
    }

    public synchronized JSONArray listRules() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, name, triggers, response, enabled, source, created_at FROM rules ORDER BY id ASC", null)) {
            while (c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("name", c.getString(1));
                o.put("triggers", new JSONArray(c.getString(2)));
                o.put("response", c.getString(3));
                o.put("enabled", c.getInt(4) == 1);
                o.put("source", c.getString(5));
                o.put("created_at", c.getLong(6));
                arr.put(o);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error listing rules", e);
        }
        return arr;
    }

    public synchronized JSONObject insertRule(JSONObject r) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        long now = System.currentTimeMillis();
        cv.put("name", r.optString("name", "Aturan Baru"));
        cv.put("triggers", r.optJSONArray("triggers") != null ? r.optJSONArray("triggers").toString() : "[]");
        cv.put("response", r.optString("response", ""));
        cv.put("enabled", r.optBoolean("enabled", true) ? 1 : 0);
        cv.put("source", r.optString("source", "user"));
        cv.put("created_at", now);
        long id = db.insert("rules", null, cv);
        try {
            JSONObject res = new JSONObject();
            res.put("id", id);
            res.put("name", cv.getAsString("name"));
            res.put("triggers", new JSONArray(cv.getAsString("triggers")));
            res.put("response", cv.getAsString("response"));
            res.put("enabled", cv.getAsInteger("enabled") == 1);
            res.put("source", cv.getAsString("source"));
            res.put("created_at", now);
            return res;
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    public synchronized void deleteRule(int id) {
        SQLiteDatabase db = getWritableDatabase();
        db.delete("rules", "id = ?", new String[]{String.valueOf(id)});
    }

    public synchronized int clearSelfTestData() {
        SQLiteDatabase db = getWritableDatabase();
        int deleted = 0;
        deleted += db.delete("messages", "buyer LIKE ? OR text LIKE ? OR thread_id LIKE ?",
                new String[]{"%[SELFTEST]%", "%[SELFTEST]%", "%[SELFTEST]%"});
        deleted += db.delete("threads", "buyer LIKE ? OR id LIKE ?",
                new String[]{"%[SELFTEST]%", "%[SELFTEST]%"});
        deleted += db.delete("orders", "buyer LIKE ? OR address_note LIKE ?",
                new String[]{"%[SELFTEST]%", "%[SELFTEST]%"});
        deleted += db.delete("anomaly_alerts", "buyer LIKE ? OR message_text LIKE ? OR thread_id LIKE ?",
                new String[]{"%[SELFTEST]%", "%[SELFTEST]%", "%[SELFTEST]%"});
        deleted += db.delete("products", "name LIKE ? OR sku LIKE ?",
                new String[]{"%[SELFTEST]%", "SELFTEST%"});
        return deleted;
    }

    public synchronized void resetAllData() {
        SQLiteDatabase db = getWritableDatabase();
        db.execSQL("DELETE FROM messages");
        db.execSQL("DELETE FROM threads");
        db.execSQL("DELETE FROM orders");
        db.execSQL("DELETE FROM anomaly_alerts");
        db.execSQL("DELETE FROM products WHERE sku != 'STK-CAT-01'");
        try (Cursor c = db.rawQuery("SELECT id FROM products WHERE sku = 'STK-CAT-01'", null)) {
            if (c.moveToNext()) {
                db.execSQL("UPDATE products SET stock = 50 WHERE sku = 'STK-CAT-01'");
            } else {
                long now = System.currentTimeMillis();
                insertProduct(db, "STK-CAT-01", "Paket Stiker Kucing Gemoy Vinyl Waterproof Lucu Anti Air Die Cut Isi 20 Pcs",
                        "[\"paket stiker kucing gemoy\",\"stiker kucing gemoy\",\"stiker kucing\",\"sticker kucing\",\"stiker vinyl\",\"stiker gemoy\",\"stiker\",\"sticker\",\"sticker cat\",\"kucing\"]",
                        "pack", 15000, 6000, 50, 100, 15, now);
            }
        }
    }

    public synchronized boolean addProduct(String sku, String name, int price, int hpp, int stock, String unit) {
        SQLiteDatabase db = getWritableDatabase();
        long now = System.currentTimeMillis();
        String aliases = "[\"" + name.toLowerCase(java.util.Locale.ROOT) + "\",\"" + sku.toLowerCase(java.util.Locale.ROOT) + "\"]";
        insertProduct(db, sku, name, aliases, unit != null && !unit.isEmpty() ? unit : "pcs", price, hpp, stock, 100, 15, now);
        return true;
    }

    public synchronized void setSetting(String key, String val) {
        SQLiteDatabase db = getWritableDatabase();
        setSettingInternal(db, key, val);
    }

    public synchronized boolean isOnboardingCompleted() {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT value FROM settings WHERE key = 'onboarding_completed'", null)) {
            if (c.moveToNext()) {
                return "1".equals(c.getString(0));
            }
        } catch (Exception ignored) {}
        return false;
    }

    public synchronized void setOnboardingCompleted(boolean completed) {
        setSetting("onboarding_completed", completed ? "1" : "0");
    }

    public synchronized void resetToFreshInstall() {
        SQLiteDatabase db = getWritableDatabase();
        db.execSQL("DELETE FROM messages");
        db.execSQL("DELETE FROM threads");
        db.execSQL("DELETE FROM orders");
        db.execSQL("DELETE FROM anomaly_alerts");
        db.execSQL("DELETE FROM products");
        db.execSQL("DELETE FROM store_accounts");
        db.execSQL("DELETE FROM settings WHERE key = 'onboarding_completed'");
    }

    public synchronized void seedDemoStickeria() {
        SQLiteDatabase db = getWritableDatabase();
        seedDefaults(db);
        setSetting("onboarding_completed", "1");
    }

    /**
     * Latest Shopee order bound to a chat thread. Used to make the "Potong Stok" action
     * idempotent: once a thread has a paid/cancelled Shopee order the button must stay closed.
     */
    public synchronized JSONObject getLatestShopeeOrderForThread(String threadId, String buyer) {
        SQLiteDatabase db = getReadableDatabase();
        String sql = "SELECT id, code, buyer, channel, items, total, status, source, missing_fields, address_note, created_at, thread_id "
                + "FROM orders WHERE channel = 'shopee' ORDER BY id DESC LIMIT 40";
        try (Cursor c = db.rawQuery(sql, null)) {
            while (c.moveToNext()) {
                String oThread = c.getString(11);
                String oBuyer = c.getString(2);
                boolean sameThread = threadId != null && !threadId.isEmpty() && threadId.equalsIgnoreCase(oThread);
                boolean sameBuyer = buyer != null && !buyer.trim().isEmpty() && oBuyer != null
                        && oBuyer.toLowerCase(java.util.Locale.ROOT).trim()
                        .equals(buyer.toLowerCase(java.util.Locale.ROOT).trim());
                if (!sameThread && !sameBuyer) continue;

                JSONObject o = new JSONObject();
                o.put("id", c.getInt(0));
                o.put("code", c.getString(1));
                o.put("buyer", c.getString(2));
                o.put("channel", c.getString(3));
                o.put("items", new JSONArray(c.getString(4)));
                o.put("total", c.getInt(5));
                o.put("status", c.getString(6));
                o.put("source", c.getString(7));
                o.put("missing_fields", new JSONArray(c.getString(8)));
                o.put("address_note", c.getString(9));
                o.put("created_at", c.getLong(10));
                o.put("thread_id", c.getString(11));
                return o;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getLatestShopeeOrderForThread", e);
        }
        return null;
    }

    public synchronized JSONObject getActiveOrderByBuyer(String buyer) {
        if (buyer == null || buyer.trim().isEmpty()) return null;
        String bClean = buyer.toLowerCase(java.util.Locale.ROOT).trim();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, code, buyer, channel, items, total, status, source, missing_fields, address_note, created_at, thread_id FROM orders WHERE status = 'reserved' ORDER BY id DESC", null)) {
            while (c.moveToNext()) {
                String oBuyer = c.getString(2).toLowerCase(java.util.Locale.ROOT).trim();
                if (oBuyer.equals(bClean) || oBuyer.contains(bClean) || bClean.contains(oBuyer)) {
                    JSONObject o = new JSONObject();
                    o.put("id", c.getInt(0));
                    o.put("code", c.getString(1));
                    o.put("buyer", c.getString(2));
                    o.put("channel", c.getString(3));
                    o.put("items", new JSONArray(c.getString(4)));
                    o.put("total", c.getInt(5));
                    o.put("status", c.getString(6));
                    o.put("source", c.getString(7));
                    o.put("missing_fields", new JSONArray(c.getString(8)));
                    o.put("address_note", c.getString(9));
                    o.put("created_at", c.getLong(10));
                    o.put("thread_id", c.getString(11));
                    return o;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getActiveOrderByBuyer", e);
        }
        return null;
    }
}
