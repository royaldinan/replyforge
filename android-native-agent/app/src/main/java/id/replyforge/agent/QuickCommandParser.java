package id.replyforge.agent;

import android.database.sqlite.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Offline, dependency-free parser for the "Perintah cepat" field on the Stok tab.
 *
 * Supported commands (case-insensitive, extra whitespace tolerated):
 *   tambah <qty> <sku>            -> adjustStock(sku, +qty)
 *   +<qty> <sku>                  -> adjustStock(sku, +qty)
 *   stok <sku> <qty>              -> adjustStock(sku, +qty)
 *   kurang <qty> <sku>            -> adjustStock(sku, -qty)
 *   -<qty> <sku>                  -> adjustStock(sku, -qty)
 *   tambah produk <nama> harga <n> hpp <n> stok <n> [satuan <u>] [sku <kode>]
 *
 * No network, no AI calls, no new dependencies.
 */
public final class QuickCommandParser {

    public static final String ACTION_STOCK_ADD = "stock_add";
    public static final String ACTION_STOCK_SUB = "stock_sub";
    public static final String ACTION_PRODUCT_ADD = "product_add";
    public static final String ACTION_NEED_CHOICE = "need_choice";
    public static final String ACTION_ERROR = "error";

    private static final String USAGE =
            "Format tidak dikenali. Contoh: tambah 10 STK-CAT-01 | kurang 2 STK-CAT-01 | "
                    + "stok STK-CAT-01 10 | tambah produk Stiker A harga 15000 hpp 6000 stok 10 satuan pack";

    private QuickCommandParser() {
    }

    public static class Result {
        public boolean ok;
        public String message;
        public String action;
        public java.util.List<String> candidates;
    }

    public static class CmdCase {
        public String name;
        public boolean pass;
        public String detail;
    }

    /**
     * Parses and applies one quick command against the local database.
     * Never performs network or AI calls.
     */
    public static Result execute(ReplyForgeDb db, String input) {
        if (db == null) return error("Database tidak tersedia.");
        if (input == null || input.trim().isEmpty()) return error(USAGE);

        String cmd = normalize(input);
        String[] tokens = cmd.split(" ");

        String head = tokens[0].toLowerCase(Locale.ROOT);
        if ("tambah".equals(head) && tokens.length >= 2 && "produk".equals(tokens[1].toLowerCase(Locale.ROOT))) {
            return addProductCommand(db, tokens);
        }

        StockCommand stock = parseStockCommand(tokens);
        if (stock != null) return applyStock(db, stock.sku, stock.delta);

        return error(USAGE);
    }

    /**
     * Re-runs a stock command using a SKU chosen by the user from the candidate dialog.
     * Non-stock commands are executed untouched.
     */
    public static Result executeWithSku(ReplyForgeDb db, String input, String sku) {
        if (db == null) return error("Database tidak tersedia.");
        if (sku == null || sku.trim().isEmpty()) return error("SKU pilihan kosong.");
        if (input == null || input.trim().isEmpty()) return error(USAGE);

        StockCommand stock = parseStockCommand(normalize(input).split(" "));
        if (stock == null) return execute(db, input);
        return applyStock(db, sku.trim(), stock.delta);
    }

    // ------------------------------------------------------------------
    // Stock commands
    // ------------------------------------------------------------------

    private static StockCommand parseStockCommand(String[] tokens) {
        if (tokens.length == 0) return null;
        String head = tokens[0].toLowerCase(Locale.ROOT);

        if ("tambah".equals(head) || "kurang".equals(head)) {
            if (tokens.length < 3) return null;
            int qty = positiveInt(tokens[1]);
            if (qty < 0) return null;
            String query = join(tokens, 2, tokens.length).trim();
            if (query.isEmpty()) return null;
            return new StockCommand(query, "tambah".equals(head) ? qty : -qty);
        }

        if ("stok".equals(head)) {
            if (tokens.length < 3) return null;
            int qtyLast = positiveInt(tokens[tokens.length - 1]);
            if (qtyLast > 0) {
                String query = join(tokens, 1, tokens.length - 1).trim();
                if (!query.isEmpty()) return new StockCommand(query, qtyLast);
            }
            int qtyFirst = positiveInt(tokens[1]);
            if (qtyFirst > 0) {
                String query = join(tokens, 2, tokens.length).trim();
                if (!query.isEmpty()) return new StockCommand(query, qtyFirst);
            }
            return null;
        }

        String first = tokens[0];
        if (first.length() > 1 && (first.charAt(0) == '+' || first.charAt(0) == '-')) {
            if (tokens.length < 2) return null;
            int qty = positiveInt(first.substring(1));
            if (qty < 0) return null;
            String query = join(tokens, 1, tokens.length).trim();
            if (query.isEmpty()) return null;
            return new StockCommand(query, first.charAt(0) == '+' ? qty : -qty);
        }

        return null;
    }

    private static Result applyStock(ReplyForgeDb db, String query, int delta) {
        if (query == null || query.trim().isEmpty()) {
            return error("Target produk tidak boleh kosong.");
        }
        String q = query.trim();

        JSONObject product = db.getProductBySku(q);
        if (product != null) {
            return applyStockToProduct(db, product, delta);
        }

        List<String> candidates = findCandidates(db, q);
        if (candidates.size() == 1) {
            JSONObject matched = db.getProductBySku(candidates.get(0));
            if (matched != null) {
                return applyStockToProduct(db, matched, delta);
            }
        } else if (candidates.size() > 1) {
            Result r = base();
            r.action = ACTION_NEED_CHOICE;
            r.message = "Ditemukan beberapa produk untuk '" + q + "'. Mungkin maksud Anda salah satu kandidat?";
            r.candidates = candidates;
            return r;
        }

        return error("Produk/SKU tidak ditemukan untuk kata kunci: " + q + ". Stok tidak berubah.");
    }

    private static Result applyStockToProduct(ReplyForgeDb db, JSONObject product, int delta) {
        String sku = product.optString("sku", "");
        JSONObject updated = db.adjustStock(sku, delta);
        int stock = updated != null ? updated.optInt("stock", -1) : -1;
        String unit = updated != null ? updated.optString("unit", "pcs") : product.optString("unit", "pcs");

        Result r = base();
        r.ok = true;
        r.action = delta >= 0 ? ACTION_STOCK_ADD : ACTION_STOCK_SUB;
        r.message = "Stok " + sku
                + (delta >= 0 ? " bertambah " : " berkurang ")
                + Math.abs(delta) + " " + unit
                + ". Stok sekarang: " + (stock >= 0 ? String.valueOf(stock) : "-") + ".";
        return r;
    }

    private static List<String> findCandidates(ReplyForgeDb db, String query) {
        List<String> out = new ArrayList<>();
        if (query == null) return out;
        String q = query.trim().toLowerCase(Locale.ROOT);
        if (q.isEmpty()) return out;

        JSONArray products = db.listProducts();
        for (int i = 0; i < products.length(); i++) {
            JSONObject p = products.optJSONObject(i);
            if (p == null) continue;

            String sku = p.optString("sku", "");
            String skuLower = sku.toLowerCase(Locale.ROOT);
            String name = p.optString("name", "").toLowerCase(Locale.ROOT);

            boolean match = skuLower.equals(q)
                    || (!skuLower.isEmpty() && skuLower.contains(q))
                    || (!name.isEmpty() && (name.contains(q) || q.contains(name)));

            if (!match) {
                JSONArray aliases = p.optJSONArray("aliases");
                if (aliases != null) {
                    for (int j = 0; j < aliases.length(); j++) {
                        String alias = aliases.optString(j, "").toLowerCase(Locale.ROOT).trim();
                        if (!alias.isEmpty() && (alias.contains(q) || q.contains(alias))) {
                            match = true;
                            break;
                        }
                    }
                }
            }

            if (!match && !name.isEmpty() && q.contains(" ")) {
                String[] words = q.split("\\s+");
                boolean allWordsFound = true;
                for (String w : words) {
                    if (w.isEmpty()) continue;
                    if (!name.contains(w) && !skuLower.contains(w)) {
                        allWordsFound = false;
                        break;
                    }
                }
                if (allWordsFound) {
                    match = true;
                }
            }

            if (match && !sku.isEmpty() && !out.contains(sku)) {
                out.add(sku);
            }
        }
        return out;
    }

    // ------------------------------------------------------------------
    // Product commands (keyword anchors, name may contain spaces)
    // ------------------------------------------------------------------

    private static Result addProductCommand(ReplyForgeDb db, String[] tokens) {
        int hargaIdx = -1, hppIdx = -1, stokIdx = -1, satuanIdx = -1, skuIdx = -1;
        for (int i = 2; i < tokens.length; i++) {
            String t = tokens[i].toLowerCase(Locale.ROOT);
            if (hargaIdx < 0 && "harga".equals(t)) {
                hargaIdx = i;
            } else if (hppIdx < 0 && "hpp".equals(t)) {
                hppIdx = i;
            } else if (stokIdx < 0 && "stok".equals(t)) {
                stokIdx = i;
            } else if (satuanIdx < 0 && "satuan".equals(t)) {
                satuanIdx = i;
            } else if (skuIdx < 0 && "sku".equals(t)) {
                skuIdx = i;
            }
        }

        int firstAnchor = firstPositive(hargaIdx, hppIdx, stokIdx, satuanIdx, skuIdx);
        if (firstAnchor < 0 || firstAnchor <= 2) {
            return error("Nama produk wajib diisi. Contoh: tambah produk Stiker A harga 15000 hpp 6000 stok 10 satuan pack");
        }
        if (hargaIdx < 0 || hppIdx < 0 || stokIdx < 0) {
            return error("Format produk butuh 'harga', 'hpp', dan 'stok'. Contoh: tambah produk Stiker A harga 15000 hpp 6000 stok 10 satuan pack");
        }

        String name = join(tokens, 2, firstAnchor);
        Integer price = intAt(tokens, hargaIdx + 1);
        Integer hpp = intAt(tokens, hppIdx + 1);
        Integer stock = intAt(tokens, stokIdx + 1);

        if (price == null) return error("Nilai 'harga' tidak valid. Contoh: harga 15000");
        if (hpp == null) return error("Nilai 'hpp' tidak valid. Contoh: hpp 6000");
        if (stock == null) return error("Nilai 'stok' tidak valid. Contoh: stok 10");
        if (price < 0 || hpp < 0 || stock < 0) return error("Harga, HPP, dan stok tidak boleh negatif.");

        String unit = "";
        if (satuanIdx >= 0) {
            if (satuanIdx + 1 >= tokens.length || isKeyword(tokens[satuanIdx + 1])) {
                return error("Nilai 'satuan' tidak ditemukan. Contoh: satuan pack");
            }
            unit = tokens[satuanIdx + 1];
        }

        String sku;
        if (skuIdx >= 0) {
            if (skuIdx + 1 >= tokens.length || isKeyword(tokens[skuIdx + 1])) {
                return error("Nilai 'sku' tidak ditemukan. Contoh: sku PRD-1234");
            }
            sku = tokens[skuIdx + 1];
        } else {
            sku = "PRD-" + (System.currentTimeMillis() % 10000);
        }

        db.addProduct(sku, name, price, hpp, stock, unit);

        JSONObject created = db.getProductBySku(sku);
        if (created == null) return error("Produk gagal disimpan (SKU " + sku + ").");

        Result r = base();
        r.ok = true;
        r.action = ACTION_PRODUCT_ADD;
        r.message = "Produk '" + name + "' ditambahkan dengan SKU " + sku
                + ", stok " + stock + " " + (unit.isEmpty() ? "pcs" : unit) + ".";
        return r;
    }

    // ------------------------------------------------------------------
    // Self-test surface for T10 (offline, deterministic, no data pollution)
    // ------------------------------------------------------------------

    public static java.util.List<CmdCase> runParserCases(ReplyForgeDb db) {
        List<CmdCase> out = new ArrayList<>();
        if (db == null) {
            out.add(newCase("CMD_STOCK_ADD", false, "db=null"));
            out.add(newCase("CMD_STOCK_SUB", false, "db=null"));
            out.add(newCase("CMD_PRODUCT_ADD", false, "db=null"));
            out.add(newCase("CMD_UNKNOWN", false, "db=null"));
            return out;
        }

        // Remove leftovers first so repeated runs stay deterministic.
        deleteSelftestProducts(db);

        JSONObject seed = db.getProductBySku("STK-CAT-01");
        if (seed == null) {
            out.add(newCase("CMD_STOCK_ADD", false, "Produk seed STK-CAT-01 tidak ditemukan"));
            out.add(newCase("CMD_STOCK_SUB", false, "Produk seed STK-CAT-01 tidak ditemukan"));
            out.add(newCase("CMD_PRODUCT_ADD", false, "Produk seed STK-CAT-01 tidak ditemukan"));
        } else {
            int original = seed.optInt("stock", 0);
            int capacity = seed.optInt("capacity", 100);

            Result add = execute(db, "tambah 3 STK-CAT-01");
            int afterAdd = stockOf(db, "STK-CAT-01");
            int expectAdd = clamp(original + 3, capacity);
            out.add(newCase("CMD_STOCK_ADD", add.ok && afterAdd == expectAdd,
                    "cmd='tambah 3 STK-CAT-01' expectedStock=" + expectAdd + " actualStock=" + afterAdd
                            + " ok=" + add.ok + " msg=" + add.message));
            restoreStock(db, "STK-CAT-01", original);

            Result sub = execute(db, "kurang 2 STK-CAT-01");
            int afterSub = stockOf(db, "STK-CAT-01");
            int expectSub = clamp(original - 2, capacity);
            out.add(newCase("CMD_STOCK_SUB", sub.ok && afterSub == expectSub,
                    "cmd='kurang 2 STK-CAT-01' expectedStock=" + expectSub + " actualStock=" + afterSub
                            + " ok=" + sub.ok + " msg=" + sub.message));
            restoreStock(db, "STK-CAT-01", original);

            Result product = execute(db,
                    "tambah produk [SELFTEST] Stiker Uji Otomatis harga 12000 hpp 5000 stok 7 satuan pcs sku SELFTEST-PRD-01");
            JSONObject created = db.getProductBySku("SELFTEST-PRD-01");
            boolean productPass = product.ok && created != null
                    && "[SELFTEST] Stiker Uji Otomatis".equals(created.optString("name"))
                    && created.optInt("price", -1) == 12000
                    && created.optInt("hpp", -1) == 5000
                    && created.optInt("stock", -1) == 7
                    && "pcs".equals(created.optString("unit"));
            out.add(newCase("CMD_PRODUCT_ADD", productPass,
                    "expected name=[SELFTEST] Stiker Uji Otomatis price=12000 hpp=5000 stock=7 unit=pcs; actual="
                            + (created == null ? "<tidak dibuat>" : created.toString())
                            + " ok=" + product.ok + " msg=" + product.message));
            deleteSelftestProducts(db);

            Result fuzzyAdd = execute(db, "tambah 10 stiker kucing");
            int afterFuzzyAdd = stockOf(db, "STK-CAT-01");
            int expectFuzzyAdd = clamp(original + 10, capacity);
            out.add(newCase("CMD_FUZZY_MULTIWORD_ADD", fuzzyAdd.ok && afterFuzzyAdd == expectFuzzyAdd,
                    "cmd='tambah 10 stiker kucing' expectedStock=" + expectFuzzyAdd + " actualStock=" + afterFuzzyAdd
                            + " ok=" + fuzzyAdd.ok + " msg=" + fuzzyAdd.message));
            restoreStock(db, "STK-CAT-01", original);

            Result fuzzySub = execute(db, "kurang 2 stiker kucing");
            int afterFuzzySub = stockOf(db, "STK-CAT-01");
            int expectFuzzySub = clamp(original - 2, capacity);
            out.add(newCase("CMD_FUZZY_MULTIWORD_SUB", fuzzySub.ok && afterFuzzySub == expectFuzzySub,
                    "cmd='kurang 2 stiker kucing' expectedStock=" + expectFuzzySub + " actualStock=" + afterFuzzySub
                            + " ok=" + fuzzySub.ok + " msg=" + fuzzySub.message));
            restoreStock(db, "STK-CAT-01", original);

            Result aliasGemoy = execute(db, "tambah 5 kucing gemoy");
            int afterGemoy = stockOf(db, "STK-CAT-01");
            int expectGemoy = clamp(original + 5, capacity);
            out.add(newCase("CMD_FUZZY_ALIAS_MATCH", aliasGemoy.ok && afterGemoy == expectGemoy,
                    "cmd='tambah 5 kucing gemoy' expectedStock=" + expectGemoy + " actualStock=" + afterGemoy
                            + " ok=" + aliasGemoy.ok + " msg=" + aliasGemoy.message));
            restoreStock(db, "STK-CAT-01", original);

            Result catAdd = execute(db, "+4 cat");
            int afterCat = stockOf(db, "STK-CAT-01");
            int expectCat = clamp(original + 4, capacity);
            out.add(newCase("CMD_FUZZY_SHORT_ALIAS", catAdd.ok && afterCat == expectCat,
                    "cmd='+4 cat' expectedStock=" + expectCat + " actualStock=" + afterCat
                            + " ok=" + catAdd.ok + " msg=" + catAdd.message));
            restoreStock(db, "STK-CAT-01", original);

            Result prefixSub = execute(db, "-2 stiker");
            int afterPrefixSub = stockOf(db, "STK-CAT-01");
            int expectPrefixSub = clamp(original - 2, capacity);
            out.add(newCase("CMD_FUZZY_PREFIX_SUB", prefixSub.ok && afterPrefixSub == expectPrefixSub,
                    "cmd='-2 stiker' expectedStock=" + expectPrefixSub + " actualStock=" + afterPrefixSub
                            + " ok=" + prefixSub.ok + " msg=" + prefixSub.message));
            restoreStock(db, "STK-CAT-01", original);

            Result stockCmd = execute(db, "stok stiker kucing 50");
            int afterStockCmd = stockOf(db, "STK-CAT-01");
            int expectStockCmd = clamp(original + 50, capacity);
            out.add(newCase("CMD_STOCK_MULTIWORD", stockCmd.ok && afterStockCmd == expectStockCmd,
                    "cmd='stok stiker kucing 50' expectedStock=" + expectStockCmd + " actualStock=" + afterStockCmd
                            + " ok=" + stockCmd.ok + " msg=" + stockCmd.message));
            restoreStock(db, "STK-CAT-01", original);

            execute(db, "tambah produk [SELFTEST] Stiker Kucing Hitam harga 10000 hpp 4000 stok 5 satuan pcs sku SELFTEST-CAT-02");
            Result choice = execute(db, "tambah 5 stiker kucing");
            boolean choicePass = !choice.ok
                    && ACTION_NEED_CHOICE.equals(choice.action)
                    && choice.candidates != null
                    && choice.candidates.size() >= 2
                    && choice.candidates.contains("STK-CAT-01")
                    && choice.candidates.contains("SELFTEST-CAT-02");

            Result appliedChoice = QuickCommandParser.executeWithSku(db, "tambah 5 stiker kucing", "STK-CAT-01");
            int afterChoice = stockOf(db, "STK-CAT-01");
            int expectChoice = clamp(original + 5, capacity);
            boolean choiceApplyPass = choicePass && appliedChoice.ok && afterChoice == expectChoice;
            out.add(newCase("CMD_FUZZY_AMBIGUOUS_CHOICE", choiceApplyPass,
                    "cmd='tambah 5 stiker kucing' choicePass=" + choicePass + " appliedOk=" + appliedChoice.ok
                            + " expectedStock=" + expectChoice + " actualStock=" + afterChoice));
            restoreStock(db, "STK-CAT-01", original);
            deleteSelftestProducts(db);
        }

        int stockBefore = stockOf(db, "STK-CAT-01");
        Result unknown = execute(db, "tambah 10 SKU-NGAWUR");
        int stockAfter = stockOf(db, "STK-CAT-01");
        boolean unknownPass = !unknown.ok
                && unknown.message != null
                && unknown.message.contains("SKU-NGAWUR")
                && unknown.message.toLowerCase(Locale.ROOT).contains("tidak ditemukan")
                && stockBefore == stockAfter;
        out.add(newCase("CMD_UNKNOWN", unknownPass,
                "cmd='tambah 10 SKU-NGAWUR' expected=fail menyebut SKU-NGAWUR, stok tetap; actual ok="
                        + unknown.ok + " msg=" + unknown.message + " stockBefore=" + stockBefore
                        + " stockAfter=" + stockAfter));

        return out;
    }

    private static void deleteSelftestProducts(ReplyForgeDb db) {
        SQLiteDatabase database = db.getWritableDatabase();
        database.execSQL("DELETE FROM products WHERE name LIKE '[SELFTEST]%'");
        database.execSQL("DELETE FROM products WHERE sku LIKE 'SELFTEST-%'");
    }

    private static void restoreStock(ReplyForgeDb db, String sku, int target) {
        JSONObject p = db.getProductBySku(sku);
        if (p == null) return;
        int current = p.optInt("stock", target);
        if (current != target) db.adjustStock(sku, target - current);
    }

    private static int stockOf(ReplyForgeDb db, String sku) {
        JSONObject p = db.getProductBySku(sku);
        return p == null ? Integer.MIN_VALUE : p.optInt("stock", Integer.MIN_VALUE);
    }

    private static CmdCase newCase(String name, boolean pass, String detail) {
        CmdCase c = new CmdCase();
        c.name = name;
        c.pass = pass;
        c.detail = detail;
        return c;
    }

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------

    private static Result base() {
        Result r = new Result();
        r.ok = false;
        r.message = "";
        r.action = ACTION_ERROR;
        r.candidates = new ArrayList<>();
        return r;
    }

    private static Result error(String message) {
        Result r = base();
        r.message = message;
        return r;
    }

    private static String normalize(String input) {
        return input.trim().replaceAll("\\s+", " ");
    }

    private static int positiveInt(String raw) {
        try {
            int v = Integer.parseInt(raw);
            return v > 0 ? v : -1;
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private static Integer intAt(String[] tokens, int idx) {
        if (idx < 0 || idx >= tokens.length) return null;
        try {
            return Integer.valueOf(tokens[idx]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String join(String[] tokens, int from, int toExclusive) {
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < toExclusive; i++) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(tokens[i]);
        }
        return sb.toString().trim();
    }

    private static boolean isKeyword(String token) {
        String t = token.toLowerCase(Locale.ROOT);
        return "harga".equals(t) || "hpp".equals(t) || "stok".equals(t)
                || "satuan".equals(t) || "sku".equals(t) || "produk".equals(t);
    }

    private static int firstPositive(int... values) {
        int best = -1;
        for (int v : values) {
            if (v >= 0 && (best < 0 || v < best)) best = v;
        }
        return best;
    }

    private static int clamp(int value, int capacity) {
        return Math.max(0, Math.min(capacity, value));
    }

    private static final class StockCommand {
        final String sku;
        final int delta;

        StockCommand(String sku, int delta) {
            this.sku = sku;
            this.delta = delta;
        }
    }
}
