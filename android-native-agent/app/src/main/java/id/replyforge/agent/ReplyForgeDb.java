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
    private static final int DATABASE_VERSION = 1;

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

        seedDefaults(db);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Upgrade migration if needed
    }

    private void seedDefaults(SQLiteDatabase db) {
        long now = System.currentTimeMillis();

        // 1. Seed 4 Official Lina Shop Products
        insertProduct(db, "STK-CAT-01", "Paket Stiker Kucing Gemoy Vinyl Waterproof",
                "[\"paket stiker kucing gemoy\",\"stiker kucing gemoy\",\"stiker kucing\",\"sticker kucing\",\"stiker vinyl\",\"stiker gemoy\",\"stiker\",\"sticker\",\"sticker cat\"]",
                "pack", 15000, 6000, 50, 100, 15, now);

        insertProduct(db, "KC-ACRYL-02", "Gantungan Kunci Akrilik Capybara 2 Sisi",
                "[\"gantungan kunci akrilik capybara\",\"gantungan kunci capybara\",\"keychain capybara\",\"gantungan kunci\",\"keychain\",\"capybara\"]",
                "pcs", 25000, 12000, 30, 60, 10, now);

        insertProduct(db, "GPT-FLW-03", "Griptok HP Akrilik Bunga Daisy",
                "[\"griptok hp akrilik bunga daisy\",\"griptok daisy\",\"griptok bunga\",\"griptok hp\",\"griptok\",\"popsocket daisy\"]",
                "pcs", 20000, 8000, 25, 50, 10, now);

        insertProduct(db, "PC-HLD-04", "Photocard Holder Plushie Kelinci Lucu",
                "[\"photocard holder plushie kelinci\",\"photocard holder kelinci\",\"pc holder kelinci\",\"pc holder plushie\",\"photocard holder\",\"pc holder\"]",
                "pcs", 35000, 18000, 15, 30, 8, now);

        // 2. Seed Store Account (Lina Shop)
        ContentValues acc = new ContentValues();
        acc.put("email", "owner@linashop.id");
        acc.put("phone", "085183250750");
        acc.put("owner_name", "Lina Permata");
        acc.put("store_name", "Lina Shop");
        acc.put("category", "Aksesoris & Merchandise Kreatif");
        acc.put("shopee_handle", "@linashop.id");
        acc.put("whatsapp_number", "0851-8325-0750");
        acc.put("bank_account", "BCA 5271 8890 21 a.n. Lina Shop");
        acc.put("shopee_connected", 0);
        acc.put("whatsapp_connected", 1);
        acc.put("os_notification_granted", 1);
        acc.put("onboarding_completed", 1);
        acc.put("created_at", now);
        db.insert("store_accounts", null, acc);

        // 3. Seed Settings
        setSettingInternal(db, "storeName", "Lina Shop");
        setSettingInternal(db, "ownerName", "Lina Permata");
        setSettingInternal(db, "cutoff", "16.00");
        setSettingInternal(db, "bankAccount", "BCA 5271 8890 21 a.n. Lina Shop");
        setSettingInternal(db, "tone", "santai");
        setSettingInternal(db, "mode", "autopilot");
        setSettingInternal(db, "model", "gemini-1.5-flash");
        setSettingInternal(db, "baseUrl", "https://generativelanguage.googleapis.com/v1beta/openai");
        setSettingInternal(db, "apiKey", "");
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

    public synchronized JSONArray listOrders() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT id, code, buyer, channel, items, total, status, source, missing_fields, address_note, created_at FROM orders ORDER BY id DESC", null)) {
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
        try (Cursor c = db.rawQuery("SELECT id, code, buyer, channel, items, total, status, source, missing_fields, address_note, created_at FROM orders WHERE id = ?", new String[]{String.valueOf(id)})) {
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

    public synchronized void resetAllData() {
        SQLiteDatabase db = getWritableDatabase();
        db.execSQL("DELETE FROM messages");
        db.execSQL("DELETE FROM threads");
        db.execSQL("DELETE FROM orders");
        db.execSQL("DELETE FROM anomaly_alerts");
    }
}
