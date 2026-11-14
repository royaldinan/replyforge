package id.replyforge.agent;

import android.content.Context;
import android.os.PowerManager;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * High-Intelligence Indonesian Conversational Commerce Engine for ReplyForge.
 * 
 * 1. Cloud AI Mode: Direct HTTPS connection to Google Gemini / OpenRouter / Groq.
 * 2. Slang & Colloquial Master: Understands Indonesian online shopping slang, typos, and abbreviations.
 * 3. Strict Business Rules: HPP Guard (anti-rugi), Shipping Cutoff (16.00 WIB), Official BCA Account.
 * 4. Non-Pushy Policy: Answers availability warmly without forcing order confirmation on simple inquiries.
 * 5. Adaptive Local Engine: 100% Offline fallback when internet/API key is unavailable.
 */
public class ReplyForgeAiEngine {

    private static final String TAG = "ReplyForgeAi";
    private static final Random RANDOM = new Random();

    /** Reports whether the device screen is interactive. Never allowed to block a reply. */
    public interface InteractionGate {
        boolean isInteractive();
    }

    /** Produces a model reply for a prompt. Injectable so tests can run with zero network. */
    public interface ReplyGenerator {
        String generate(String prompt) throws Exception;
    }

    /**
     * Per-message anomaly outcome. The thread is never paused for these:
     * NEEDS_REVIEW = label "Perlu ditinjau", seller sends manually;
     * BLOCKED = this message only is not auto-answered.
     */
    public enum AnomalyStatus {
        NONE, NEEDS_REVIEW, BLOCKED;
        public static final AnomalyStatus NORMAL = NONE;
    }

    /** Default gate backed by PowerManager.isInteractive(). Fails open (interactive) on any error. */
    public static class PowerManagerGate implements InteractionGate {
        private final Context context;

        public PowerManagerGate(Context context) {
            this.context = context;
        }

        @Override
        public boolean isInteractive() {
            try {
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                return pm == null || pm.isInteractive();
            } catch (Exception e) {
                return true;
            }
        }
    }

    // Cloud call patience budget (ms). Screen-off lowers it; it never skips the call's local fallback.
    private static final int CONNECT_TIMEOUT_MS = 1500;
    private static final int READ_TIMEOUT_MS = 2500;
    private static final int CONNECT_TIMEOUT_SCREEN_OFF_MS = 1000;
    private static final int READ_TIMEOUT_SCREEN_OFF_MS = 1500;

    private static final Pattern SUSPICIOUS_LINK = Pattern.compile(
            "\\.apk\\b|\\b(?:bit\\.ly|tinyurl\\.com|cutt\\.ly|s\\.id|t\\.ly|is\\.gd|shorturl\\.at|rebrand\\.ly)/");

    public static class AiResponse {
        public final String reply;
        public final boolean isAnomaly;
        public final String anomalyKind;
        public final String anomalyTitle;
        public final String anomalyReason;
        public final int requestedQty;
        public final String sku;
        public final AnomalyStatus status;

        public AiResponse(String reply) {
            this.reply = reply;
            this.isAnomaly = false;
            this.anomalyKind = null;
            this.anomalyTitle = null;
            this.anomalyReason = null;
            this.requestedQty = 0;
            this.sku = null;
            this.status = AnomalyStatus.NONE;
        }

        public AiResponse(String anomalyKind, String anomalyTitle, String anomalyReason, int requestedQty, String sku) {
            this(anomalyKind, anomalyTitle, anomalyReason, requestedQty, sku, "UNUSUAL_QUANTITY".equals(anomalyKind)
                    ? "Halo kak, untuk pemesanan dalam jumlah besar (" + requestedQty + " pack), mohon tunggu sebentar ya kak, mimin cek fisik stok di gudang terlebih dahulu agar pesanan kakak aman ✨"
                    : null);
        }

        public AiResponse(String anomalyKind, String anomalyTitle, String anomalyReason, int requestedQty, String sku, String reply) {
            this.reply = reply;
            this.isAnomaly = true;
            this.anomalyKind = anomalyKind;
            this.anomalyTitle = anomalyTitle;
            this.anomalyReason = anomalyReason;
            this.requestedQty = requestedQty;
            this.sku = sku;
            this.status = AnomalyStatus.NONE;
        }

        /**
         * Review/blocked outcome. isAnomaly stays false and reply is null so legacy callers neither
         * pause the thread nor auto-send; callers read {@link #getAnomalyStatus()} to react.
         */
        public AiResponse(AnomalyStatus status, String anomalyKind, String anomalyTitle, String anomalyReason) {
            this.reply = null;
            this.isAnomaly = false;
            this.anomalyKind = anomalyKind;
            this.anomalyTitle = anomalyTitle;
            this.anomalyReason = anomalyReason;
            this.requestedQty = 0;
            this.sku = null;
            this.status = status;
        }

        public AnomalyStatus getAnomalyStatus() {
            return status;
        }
    }

    /** Pure classifier for the keyword/link anomaly policy. BLOCKED outranks NEEDS_REVIEW. */
    public static AnomalyStatus classifyAnomaly(String text) {
        String norm = normalizeText(text);
        if (SUSPICIOUS_LINK.matcher(norm).find() ||
            norm.contains("ignore previous") || norm.contains("system prompt")) {
            return AnomalyStatus.BLOCKED;
        }
        if (norm.contains("pinjam") || norm.contains("utang") || norm.contains("hutang") ||
            norm.contains("transfer") || norm.contains("rekening") ||
            norm.contains("bayar bulan depan") || norm.contains("undangan")) {
            return AnomalyStatus.NEEDS_REVIEW;
        }
        return AnomalyStatus.NONE;
    }

    public static AiResponse processBuyerMessage(Context context, String buyer, String text) {
        return processBuyerMessage(context, buyer, text, null);
    }

    public static AiResponse processBuyerMessage(Context context, String buyer, String text, String threadId) {
        return processBuyerMessage(context, buyer, text, threadId, null, null);
    }

    /**
     * @param generator null = production HTTP model call; non-null = used instead of the network.
     * @param gate      null = PowerManager gate. Value only lowers the cloud latency budget.
     */
    public static AiResponse processBuyerMessage(Context context, String buyer, String text, String threadId,
                                                 ReplyGenerator generator, InteractionGate gate) {
        ReplyForgeDb db = ReplyForgeDb.getInstance(context);
        String norm = normalizeText(text);

        // Fetch recent messages for multi-turn contextual memory
        JSONArray recentMessages = (threadId != null && !threadId.isEmpty())
                ? db.getRecentThreadMessages(threadId, 6)
                : new JSONArray();

        // 1. ANOMALY CHECK: Suspicious queries (loan, pay next month, suspicious APK)
        AnomalyStatus anomalyStatus = classifyAnomaly(text);
        if (anomalyStatus == AnomalyStatus.BLOCKED) {
            return new AiResponse(AnomalyStatus.BLOCKED, "BLOCKED_MESSAGE", "Pesan Diblokir (Link/APK Mencurigakan)",
                    "Pesan ini berisi link atau APK mencurigakan dan tidak dibalas otomatis. Thread tetap aktif untuk pesan berikutnya.");
        }
        if (anomalyStatus == AnomalyStatus.NEEDS_REVIEW) {
            return new AiResponse(AnomalyStatus.NEEDS_REVIEW, "WEIRD_QUERY", "Perlu ditinjau",
                    "Calon pembeli menyinggung pinjaman, transfer, atau rekening. Tinjau dan kirim balasan manual; thread tetap aktif.");
        }

        // 2. MATCH PRODUCT (Current Message or Contextual History)
        JSONObject matchedProduct = matchProduct(db, norm);
        if (matchedProduct == null && recentMessages.length() > 0) {
            matchedProduct = findProductFromHistory(db, recentMessages);
        }

        // Extract Quantity
        int detectedQty = extractQuantity(norm);

        // Word-boundary intent detection: "pesanan" must NOT count as "pesan".
        boolean hasPurchaseIntent = w(norm, "order", "pesan", "beli", "ambil", "checkout", "deal", "bungkus");
        boolean isAskingOnly = norm.contains("?") || w(norm, "ready", "apakah", "ada", "bisa", "stok", "kalau", "tersedia");
        boolean isCommittedBuy = hasPurchaseIntent && !isAskingOnly;

        if (matchedProduct != null && detectedQty > 0) {
            int stock = matchedProduct.optInt("stock", 0);
            String pName = matchedProduct.optString("name", "Produk");
            String sku = matchedProduct.optString("sku", "");

            if (isCommittedBuy) {
                if (detectedQty >= 20 || detectedQty > stock) {
                    String holdReply = "Halo kak " + firstName(buyer) + ", untuk pemesanan dalam jumlah besar (" + detectedQty + " " + matchedProduct.optString("unit", "pack") + "), mohon tunggu sebentar ya kak, mimin cek fisik stok di gudang terlebih dahulu agar pesanan kakak aman ✨";
                    return new AiResponse("UNUSUAL_QUANTITY", "Pesanan Jumlah Besar (" + detectedQty + " " + matchedProduct.optString("unit", "pcs") + ")",
                            "Pembeli " + buyer + " memesan " + detectedQty + " " + pName + " (Stok tersedia: " + stock + "). Perlu konfirmasi ketersediaan fisik sebelum memproses.",
                            detectedQty, sku, holdReply);
                }
            }
        }

        String storeCity = db != null ? db.getSettings().optString("storeCity", "Bandung") : "Bandung";
        if (storeCity == null || storeCity.trim().isEmpty()) storeCity = "Bandung";

        boolean isShopee = threadId != null && threadId.startsWith("shopee:");

        if (isShopee) {
            String name = firstName(buyer);

            boolean isShippingInquiry = norm.contains("kirim") || norm.contains("pengiriman") || norm.contains("kurir")
                    || norm.contains("ekspedisi") || norm.contains("ongkir") || norm.contains("resi")
                    || norm.contains("kapan sampai") || norm.contains("sampai kapan");
            boolean isDelayComplaint = norm.contains("belum sampai") || norm.contains("belum nyampe") || norm.contains("kok belum");

            if (isShippingInquiry && !isDelayComplaint) {
                return new AiResponse("Untuk pengiriman dari " + storeCity + " ya kak " + name + " (J&T, SiCepat, Shopee Xpress). Pesanan sebelum jam 16.00 WIB dikirim hari yang sama ya kak! ✨");
            }

            boolean hasShopeeOrderIntent = w(norm, "order", "pesan", "beli", "checkout", "deal", "bungkus", "ambil");

            if (hasShopeeOrderIntent && matchedProduct != null) {
                String pName = matchedProduct.optString("name", "produk");
                return new AiResponse("Siap kak " + name + "! " + pName + " ready stok siap kirim hari ini dari " + storeCity + ". Silakan langsung checkout melalui keranjang Shopee ya kak! ✨");
            }

            if (hasShopeeOrderIntent) {
                return new AiResponse("Siap kak " + name + "! Boleh sebutkan nama produk / motif yang mau diorder? Biar mimin pastikan stok fisiknya dulu, lalu kakak tinggal checkout lewat keranjang Shopee ya ✨");
            }

            boolean hasExplicitProduct = hasExplicitProductMention(db, norm);
            boolean isAmbiguousInquiry = !hasExplicitProduct && w(norm, "ready", "ada", "stok", "katalog", "motif", "spill");

            if (isAmbiguousInquiry) {
                return new AiResponse("Halo kak " + name + "! Boleh sebutkan nama produk / motif yang kakak lihat? Biar mimin cekkan stok fisiknya langsung dan tidak salah info 😊");
            }
        }

        boolean hasOrderVerb = w(norm, "order", "pesan", "beli", "checkout", "deal", "bungkus", "ambil");
        boolean isAskingGeneral = norm.contains("?") || w(norm, "ready", "apakah", "kalau", "jika", "bisa", "diskon", "nego", "ongkir");
        boolean isDirectOrder = hasOrderVerb && !isAskingGeneral;
        if (isDirectOrder && matchedProduct != null) {
            String directOrderReply = generateAdaptiveLocalReply(db, buyer, text, norm, matchedProduct, detectedQty, false);
            return new AiResponse(directOrderReply);
        }

        // 3. TRY CLOUD AI (Google Gemini / OpenRouter / OpenAI) with Multi-Turn Context
        JSONObject settings = db.getSettings();
        String apiKey = settings.optString("apiKey", "").trim();
        String baseUrl = settings.optString("baseUrl", "https://generativelanguage.googleapis.com/v1beta/openai").trim();
        String model = settings.optString("model", "gemini-3.8-flash").trim();

        if (generator != null || !apiKey.isEmpty()) {
            if (gate == null) gate = new PowerManagerGate(context);
            boolean interactive;
            try {
                interactive = gate.isInteractive();
            } catch (Exception e) {
                interactive = true;
            }
            // Screen state only lowers the latency budget; it never suppresses the reply.
            String cloudReply = callCloudAi(db, buyer, text, recentMessages, apiKey, baseUrl, model, generator, interactive, isShopee);
            if (cloudReply != null && !cloudReply.trim().isEmpty()) {
                String sanitized = isShopee ? sanitizeShopeeReply(cloudReply.trim(), buyer, storeCity) : cloudReply.trim();
                return new AiResponse(sanitized);
            }
        }

        // 4. ADAPTIVE LOCAL CONVERSATIONAL ENGINE (100% Offline Multi-Turn Fallback)
        String localReply = generateAdaptiveLocalReply(db, buyer, text, norm, matchedProduct, detectedQty, isShopee);
        String finalLocal = isShopee ? sanitizeShopeeReply(localReply, buyer, storeCity) : localReply;
        return new AiResponse(finalLocal);
    }

    private static JSONObject findProductFromHistory(ReplyForgeDb db, JSONArray history) {
        if (history == null) return null;
        for (int i = history.length() - 1; i >= 0; i--) {
            try {
                JSONObject m = history.getJSONObject(i);
                String t = normalizeText(m.optString("text", ""));
                JSONObject p = matchProduct(db, t);
                if (p != null) return p;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static String callCloudAi(ReplyForgeDb db, String buyer, String text, JSONArray recentMessages, String apiKey, String baseUrl, String model,
                                      ReplyGenerator generator, boolean interactive, boolean isShopee) {
        int connectTimeout = interactive ? CONNECT_TIMEOUT_MS : CONNECT_TIMEOUT_SCREEN_OFF_MS;
        int readTimeout = interactive ? READ_TIMEOUT_MS : READ_TIMEOUT_SCREEN_OFF_MS;

        HttpURLConnection conn = null;
        try {
            String storeCity = db != null ? db.getSettings().optString("storeCity", "Bandung") : "Bandung";
            if (storeCity == null || storeCity.trim().isEmpty()) storeCity = "Bandung";

            JSONArray products = db.listProducts();
            StringBuilder stockContext = new StringBuilder();
            for (int i = 0; i < products.length(); i++) {
                JSONObject p = products.getJSONObject(i);
                stockContext.append("- ").append(p.getString("name"))
                        .append(": Harga Rp").append(formatRupiah(p.getInt("price")))
                        .append(" (HPP Modal Rp").append(formatRupiah(p.getInt("hpp"))).append(")")
                        .append(", Stok: ").append(p.getInt("stock")).append(" ").append(p.getString("unit"))
                        .append("\n");
            }

            String paymentRule = isShopee
                    ? "3. PEMESANAN & PEMBAYARAN: Seluruh transaksi wajib checkout melalui keranjang Shopee. DILARANG MEMBERIKAN NOMOR REKENING, DILARANG MEMINTA TRANSFER MANUAL, JANGAN SEBUT SEABANK.\n"
                    : "3. PEMBAYARAN: Rekening resmi hanya ke SeaBank 901483182051 a.n. Ferdinand Manurung.\n";

            String systemPrompt = "Anda adalah \"Lina Permata\", pemilik sekaligus admin toko online kreatif \"Stickeria\".\n" +
                    "Karakter: Ramah, santai, cekatan, akrab khas admin olshop Indonesia asli, namun profesional dan teliti.\n\n" +
                    "KEMAMPUAN BAHASA:\n" +
                    "- Sangat memahami percakapan sehari-hari, bahasa gaul anak muda, dan singkatan chat online Indonesia (cth: 'rdy', 'msh ada?', 'spill harga', 'nego tipis', 'bisa cod?', 'ongkir brp?', 'kcg', 'brp', 'orderin ya min', 'pesen').\n" +
                    "- Gunakan sapaan akrab 'kak " + firstName(buyer) + "' atau 'kakak'. JANGAN gunakan bahasa kaku bot korporat.\n" +
                    "- Jawab singkat, padat, dan natural (maksimal 2-3 kalimat seperti chat WhatsApp asli).\n\n" +
                    "KATALOG PRODUK & HARGA MODAL:\n" + stockContext.toString() + "\n" +
                    "ATURAN BISNIS MUTLAK:\n" +
                    "1. HPP GUARD: JANGAN PERNAH menyepakati harga di bawah harga modal (HPP)! Nego hanya boleh jika beli minimal 3 pack/pcs ke atas.\n" +
                    "2. JADWAL PENGIRIMAN: Batas pesanan sebelum jam 16.00 sore dikirim di hari yang sama (JNE, J&T, SiCepat, Shopee Xpress). Pengiriman dari " + storeCity + ".\n" +
                    paymentRule +
                    "4. JANGAN MEMAKSA PESANAN: Jika pembeli baru bertanya ketersediaan ('ready?'), JAWAB KETERSEDIAAN DAN SAPA DENGAN HANGAT. Dilarang langsung membuat tagihan transfer sebelum pembeli menyatakan ingin memesan/membeli.\n" +
                    "5. MULTI-TURN KONTEKS: Jika pembeli menawar ('kalo 10rb bisa?') atau memesan ('pesen 5 ya') tanpa mengulang nama barang, pahami dari percakapan sebelumnya barang apa yang dimaksud!";

            if (generator != null) {
                return generator.generate(systemPrompt + "\n\nPembeli " + buyer + ": " + text);
            }

            JSONObject payload = new JSONObject();
            payload.put("model", model);
            payload.put("temperature", 0.4);
            payload.put("max_tokens", 160);

            JSONArray messages = new JSONArray();
            JSONObject sysMsg = new JSONObject();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemPrompt);
            messages.put(sysMsg);

            // Add previous conversation turns if any
            if (recentMessages != null) {
                for (int i = 0; i < recentMessages.length(); i++) {
                    JSONObject m = recentMessages.getJSONObject(i);
                    String mText = m.optString("text", "");
                    String dir = m.optString("direction", "in");
                    if (i == recentMessages.length() - 1 && "in".equals(dir) && mText.equals(text)) {
                        continue;
                    }
                    JSONObject chatMsg = new JSONObject();
                    chatMsg.put("role", "in".equals(dir) ? "user" : "assistant");
                    chatMsg.put("content", mText);
                    messages.put(chatMsg);
                }
            }

            JSONObject usrMsg = new JSONObject();
            usrMsg.put("role", "user");
            usrMsg.put("content", text);
            messages.put(usrMsg);

            payload.put("messages", messages);

            String endpointUrl = baseUrl.replaceAll("/+$", "") + "/chat/completions";
            if (endpointUrl.contains("generativelanguage.googleapis.com") && !apiKey.isEmpty() && !endpointUrl.contains("key=")) {
                endpointUrl += "?key=" + apiKey;
            }
            URL url = new URL(endpointUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setConnectTimeout(connectTimeout);
            conn.setReadTimeout(readTimeout);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
            }

            if (conn.getResponseCode() == 200) {
                StringBuilder sb = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                }
                JSONObject resJson = new JSONObject(sb.toString());
                JSONArray choices = resJson.optJSONArray("choices");
                if (choices != null && choices.length() > 0) {
                    JSONObject choice = choices.getJSONObject(0);
                    JSONObject msg = choice.optJSONObject("message");
                    if (msg != null && msg.has("content")) {
                        return msg.getString("content").trim();
                    }
                }
            } else {
                Log.w(TAG, "Cloud AI returned HTTP " + conn.getResponseCode());
            }
        } catch (Exception e) {
            Log.w(TAG, "Cloud AI call failed, switching to local adaptive engine: " + e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    private static String generateAdaptiveLocalReply(ReplyForgeDb db, String buyer, String rawText, String norm, JSONObject product, int qty) {
        return generateAdaptiveLocalReply(db, buyer, rawText, norm, product, qty, false);
    }

    private static String generateAdaptiveLocalReply(ReplyForgeDb db, String buyer, String rawText, String norm, JSONObject product, int qty, boolean isShopee) {
        String name = firstName(buyer);
        String storeCity = db != null ? db.getSettings().optString("storeCity", "Bandung") : "Bandung";
        if (storeCity == null || storeCity.trim().isEmpty()) storeCity = "Bandung";

        // 0. Check if buyer is complaining about delayed delivery / order not received
        if (norm.contains("belum sampai") || norm.contains("belum nyampe") || norm.contains("kok belum") ||
            norm.contains("belum datang") || norm.contains("lama banget") || norm.contains("ga nyampe") ||
            (norm.contains("paket") && (norm.contains("mana") || norm.contains("lama")))) {
            return "Waduh maaf banget atas keterlambatannya ya kak " + name + " 🙏 Boleh minta nomor resi atau nama penerima di pesanan kakak? Biar langsung mimin bantu cek status dan komplain ke pihak ekspedisinya sekarang ya!";
        }

        // 1. Check if buyer is asking about shipping cost or COD
        if (isShopee) {
            if (norm.contains("kirim") || norm.contains("pengiriman") || norm.contains("kurir") || norm.contains("ekspedisi") || norm.contains("resi") || norm.contains("kapan sampai") || norm.contains("ongkir") || norm.contains("cod")) {
                return "Untuk pengiriman dari " + storeCity + " ya kak " + name + " (J&T, SiCepat, Shopee Xpress). Pesanan sebelum jam 16.00 WIB dikirim hari yang sama ya kak! ✨";
            }
        } else {
            if (norm.contains("ongkir") || norm.contains("cod") || norm.contains("bayar di tempat") || norm.contains("bayar ditempat")) {
                return "Untuk pengiriman dari " + storeCity + " ya kak " + name + " (J&T, JNE, SiCepat). Cek ongkir bisa sebutkan kecamatan & kotanya ya kak! Untuk opsi COD bisa langsung lewat toko Shopee kami (@royaldinan) ya kak ✨";
            }

            // 2. Check if buyer is asking about shipping schedule / cutoff
            if (norm.contains("kirim") || norm.contains("pengiriman") || norm.contains("kurir") || norm.contains("ekspedisi") || norm.contains("resi") || norm.contains("kapan sampai")) {
                String[] shipReplies = {
                    "Siap kak " + name + "! Kalau orderan masuk sebelum jam 16.00 sore ini, langsung kita ikutkan pengiriman hari ini juga ya 🚚 (JNE, J&T, SiCepat).",
                    "Halo kak " + name + ", pesanan yang masuk sebelum jam 4 sore meluncur hari ini juga ya! Estimasi sampai 1-3 hari kerja tergantung kota tujuan kak.",
                    "Bisa banget kak " + name + "! Toko kami ada jadwal pickup jam 16.00 sore ini, jadi langsung dikemas dan dikirim hari ini ya!"
                };
                return shipReplies[RANDOM.nextInt(shipReplies.length)];
            }
        }

        // 3. Check if buyer is negotiating price (Nego / Diskon)
        if (norm.contains("nego") || norm.contains("kurang") || norm.contains("diskon") || norm.contains("potongan") ||
            norm.contains("bisa 1") || norm.contains("bisa 2") || norm.contains("bisa murah") || norm.contains("dapet diskon")) {
            if (product != null) {
                String pName = product.optString("name", "produk ini");
                int price = product.optInt("price", 15000);
                if (isShopee) {
                    return "Halo kak " + name + "! Untuk harga " + pName + " sudah harga terbaik di Shopee ya kak (Rp" + formatRupiah(price) + ") ✨ Kualitas vinyl premium waterproof & laminasi glossy. Silakan langsung checkout via keranjang Shopee ya kak! 😊";
                }
                String[] negoReplies = {
                    "Waduh maaf banget kak " + name + " 🙏 Untuk " + pName + " harganya udah pas di Rp" + formatRupiah(price) + " ya kak karena kualitas vinyl premium waterproof. Tapi kalau ambil minimal 3 pcs ada potongan grosir kok!",
                    "Hehe harga " + pName + " udah harga pas terbaik ya kak " + name + " (Rp" + formatRupiah(price) + ") ✨ Ambil 3 pack/pcs ke atas nanti mimin kasih harga khusus deh!",
                    "Maaf kak " + name + ", belum bisa kurang kalau cuma 1 pcs ya kak 🙏 Harga Rp" + formatRupiah(price) + " udah net. Mau nambah varian lain sekalian biar hemat ongkir kak?"
                };
                return negoReplies[RANDOM.nextInt(negoReplies.length)];
            }
        }

        // 4. Check if buyer is asking about product variants / colors
        if (norm.contains("warna") || norm.contains("varian") || norm.contains("motif") || norm.contains("model apa")) {
            if (product != null) {
                String pName = product.optString("name", "produk");
                return "Halo kak " + name + "! Untuk " + pName + " saat ini ready motif/desain sesuai katalog produk yaa ✨ Semuanya real picture dengan finishing rapi. Mau difotokan detailnya kak?";
            }
        }

        // 5. Check if buyer is asking if ordering N qty is possible (Inquiry order)
        if (product != null && qty > 0 && (norm.contains("?") || norm.contains("bisa") || norm.contains("kalau") || norm.contains("jadinya"))) {
            String pName = product.optString("name", "produk");
            String unit = product.optString("unit", "pack");
            int price = product.optInt("price", 15000);
            int total = price * qty;
            if (isShopee) {
                return "Siap kak " + name + "! " + pName + " ready stok siap kirim hari ini dari " + storeCity + ". Silakan langsung checkout melalui keranjang Shopee ya kak! ✨";
            }
            return "Bisa banget kak " + name + "! Untuk " + qty + " " + unit + " " + pName + " totalnya Rp" + formatRupiah(total) + " ya ✨ Stok siap kirim hari ini. Mau langsung kami proses sekarang kak? 😊";
        }

        // 6. Check if buyer is making a DIRECT purchase commitment (STRICT: no questions, no bargaining)
        boolean hasOrderVerb = w(norm, "order", "pesan", "beli", "checkout", "deal", "bungkus", "ambil");
        boolean isAskingOnly = norm.contains("?") || w(norm, "ready", "apakah", "kalau", "jika", "bisa", "diskon", "nego", "ongkir");
        boolean isDirectOrder = hasOrderVerb && !isAskingOnly;

        if (isShopee && hasOrderVerb) {
            if (product != null) {
                String pName = product.optString("name", "produk");
                return "Siap kak " + name + "! " + pName + " ready stok siap kirim hari ini dari " + storeCity + ". Silakan langsung checkout melalui keranjang Shopee ya kak! ✨";
            }
            return "Siap kak " + name + "! Boleh sebutkan nama produk / motif yang mau diorder? Biar mimin pastikan stok fisiknya dulu ya ✨";
        }

        if (isDirectOrder && product != null) {
            int finalQty = qty > 0 ? qty : 1;
            int available = product.optInt("stock", 0);
            String pName = product.optString("name", "Paket Stiker");
            String unit = product.optString("unit", "pack");

            if (finalQty > available) {
                return "Waduh maaf kak " + name + " 🙏 Stok " + pName + " tersisa " + available + " " + unit + " saat ini, jadi belum bisa kami amankan " + finalQty + " " + unit + " sekaligus. Mau kami siapkan maksimal " + available + " " + unit + " dulu kak?";
            }

            int total = product.optInt("price", 15000) * finalQty;

            // Auto-record order in SQLite
            try {
                db.insertOrder(buyer, "whatsapp", product.getString("sku"), finalQty, product.getInt("price"), "reserved", "Menunggu transfer SeaBank");
            } catch (Exception e) {
                Log.e(TAG, "Error recording auto-order", e);
            }

            return "Siap kak " + name + "! Pesanan " + finalQty + " " + unit + " " + pName + " (Total Rp" + formatRupiah(total) + ") sudah kami amankan ya ✅ Silakan transfer ke SeaBank 901483182051 a.n. Ferdinand Manurung. Kalau transfer sebelum jam 16.00, paket langsung meluncur sore ini ya!";
        }

        // 7. Check if buyer is asking about stock availability
        boolean isStockInquiry = norm.contains("stok") || norm.contains("stock") || norm.contains("ready")
                || norm.contains("ada") || norm.contains("sisa") || norm.contains("tersedia")
                || norm.contains("berapa") || norm.contains("bisa kirim") || norm.contains("masih")
                || norm.contains("stiker") || norm.contains("produk") || norm.contains("harga");

        if (product != null && isStockInquiry) {
            String pName = product.optString("name", "produk ini");
            int stock = product.optInt("stock", 0);
            int price = product.optInt("price", 15000);
            String unit = product.optString("unit", "pack");

            if (stock > 0) {
                if (isShopee) {
                    return "Ready banget kak " + name + "! Stok " + pName + " saat ini ready " + stock + " " + unit + " siap kirim hari ini dari " + storeCity + ". Silakan langsung checkout melalui keranjang Shopee ya kak! ✨";
                }
                String[] stockReplies = {
                    "Halo kak " + name + "! " + pName + " masih ready ya kak, ada sisa " + stock + " " + unit + ". Harganya Rp" + formatRupiah(price) + ", mau disiapkan berapa " + unit + " nih kak? 😊",
                    "Ready banget kak " + name + "! Stok " + pName + " saat ini ready " + stock + " " + unit + " siap kirim hari ini. Harganya Rp" + formatRupiah(price) + " per " + unit + " ya kak!",
                    "Hai kak " + name + ", masih ready yaa ✨ Sisa " + stock + " " + unit + " lagi di katalog. Harganya Rp" + formatRupiah(price) + ", mau aku amankan sekarang?"
                };
                return stockReplies[RANDOM.nextInt(stockReplies.length)];
            } else {
                return "Yah maaf banget kak " + name + " 😭 Untuk " + pName + " kebetulan baru aja habis. Restock sekitar 2-3 hari lagi, mau mimin kabarin duluan kalau sudah ready?";
            }
        }

        // 8. Default friendly greeting
        if (product == null && (norm.contains("stok") || norm.contains("stock") || w(norm, "ready", "ada", "tersedia"))) {
            if (isShopee) {
                return "Halo kak " + name + "! Boleh sebutkan nama produk / motif yang kakak tanyakan? Biar mimin cek stok fisiknya langsung ya 😊";
            }
            return "Halo kak " + name + "! Boleh sebutkan produk yang kakak cari? Mimin cek stok dan harga terbarunya langsung ya 😊";
        }

        if (isShopee) {
            return "Halo kak " + name + "! Selamat datang di Stickeria ✨ Ada yang bisa mimin bantu? Mau cari stiker kucing gemoy atau varian lainnya kak? Boleh spill yang kakak cari ya!";
        }

        String[] defaultGreetings = {
            "Halo kak " + name + "! Selamat datang di Stickeria ✨ Ada yang bisa kami bantu? Koleksi stiker gemoy kami lagi ready siap kirim hari ini ya!",
            "Halo kak " + name + "! Terima kasih sudah menghubungi Stickeria. Mau cari stiker kucing gemoy atau stiker vinyl lainnya kak? Boleh spill yang kakak cari ya!",
            "Hai kak " + name + "! Ada yang bisa mimin Stickeria bantu hari ini? Tanya stok, info pengiriman, atau katalog silakan chat di sini ya kak 😊"
        };
        return defaultGreetings[RANDOM.nextInt(defaultGreetings.length)];
    }

    private static boolean hasExplicitProductMention(ReplyForgeDb db, String norm) {
        if (norm == null || norm.trim().isEmpty()) return false;
        JSONArray products = db.listProducts();
        for (int i = 0; i < products.length(); i++) {
            try {
                JSONObject p = products.getJSONObject(i);
                String sku = p.getString("sku").toLowerCase(Locale.ROOT);
                String name = p.getString("name").toLowerCase(Locale.ROOT);
                JSONArray aliases = p.getJSONArray("aliases");

                if (norm.contains(sku) || norm.contains(name)) return true;
                for (int j = 0; j < aliases.length(); j++) {
                    String a = aliases.getString(j).toLowerCase(Locale.ROOT);
                    if (norm.contains(a)) return true;
                }
            } catch (Exception ignored) {}
        }
        return false;
    }

    private static String sanitizeShopeeReply(String reply, String buyer, String storeCity) {
        if (reply == null) return null;
        String city = (storeCity != null && !storeCity.trim().isEmpty()) ? storeCity : "Bandung";
        if (reply.contains("SeaBank") || reply.contains("901483182051") || reply.toLowerCase(Locale.ROOT).contains("transfer")) {
            return "Siap kak " + firstName(buyer) + "! Produk ready stok siap kirim hari ini dari " + city + ". Silakan langsung checkout melalui keranjang Shopee ya kak! ✨";
        }
        if (!"Bandung".equalsIgnoreCase(city) && reply.contains("Bandung")) {
            reply = reply.replace("Bandung", city);
        }
        return reply;
    }

    private static String sanitizeShopeeReply(String reply, String buyer) {
        return sanitizeShopeeReply(reply, buyer, "Bandung");
    }

    private static String normalizeText(String raw) {
        if (raw == null) return "";
        String s = raw.toLowerCase(Locale.ROOT)
                .replaceAll("[“”\"']", "")
                .replaceAll("\\bsticker(s)?\\b", "stiker")
                .replaceAll("\\b(pesen|orderin|beliin|pesenin)\\b", "pesan")
                .replaceAll("\\b(stikerny|stikernya)\\b", "stiker")
                .replaceAll("\\b(kucingny|kucingnya)\\b", "kucing")
                .replaceAll("\\b(rdy|redi)\\b", "ready")
                .replaceAll("\\b(brp|brapa|berapah)\\b", "berapa")
                .replaceAll("\\b(kcg|kcing)\\b", "kucing")
                .replaceAll("\\b(dpt|dapet)\\b", "dapat")
                .replaceAll("\\b(msh)\\b", "masih")
                .replaceAll("\\b(bgt)\\b", "banget")
                .replaceAll("\\b(ga|gak|ngga|nggak|kaga)\\b", "tidak")
                .replaceAll("\\s+", " ")
                .trim();
        return s;
    }

    private static int extractQuantity(String norm) {
        Matcher m = Pattern.compile("\\b(\\d+)\\s*(?:pack|pcs|pc|biji|buah|botol|box)?\\b").matcher(norm);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (Exception ignored) {}
        }
        if (norm.contains("satu")) return 1;
        if (norm.contains("dua")) return 2;
        if (norm.contains("tiga")) return 3;
        if (norm.contains("empat")) return 4;
        if (norm.contains("lima")) return 5;
        if (norm.contains("sepuluh")) return 10;
        return 0;
    }

    /**
     * Whole-word matcher on normalized text. Prevents substring false positives such as
     * "pesanan" being read as an order command ("pesan") or "ada" inside "tidak ada".
     */
    static boolean w(String norm, String... words) {
        if (norm == null || words == null) return false;
        for (String word : words) {
            if (word == null || word.isEmpty()) continue;
            if (Pattern.compile("(?<![a-z0-9])" + Pattern.quote(word) + "(?![a-z0-9])").matcher(norm).find()) {
                return true;
            }
        }
        return false;
    }

    private static JSONObject matchProduct(ReplyForgeDb db, String norm) {
        JSONArray products = db.listProducts();
        for (int i = 0; i < products.length(); i++) {
            try {
                JSONObject p = products.getJSONObject(i);
                String sku = p.getString("sku").toLowerCase(Locale.ROOT);
                String name = p.getString("name").toLowerCase(Locale.ROOT);
                JSONArray aliases = p.getJSONArray("aliases");

                if (norm.contains(sku) || norm.contains(name)) return p;
                for (int j = 0; j < aliases.length(); j++) {
                    String a = aliases.getString(j).toLowerCase(Locale.ROOT);
                    if (!a.trim().isEmpty() && norm.contains(a)) return p;
                }
            } catch (Exception ignored) {}
        }
        // No blind single-product fallback: guessing the only catalogue item made every
        // unrelated chat look like a sticker order ("cenayang"). Ask instead.
        return null;
    }

    private static String firstName(String full) {
        if (full == null || full.trim().isEmpty()) return "kak";
        String clean = full.replaceAll("^[@+0-9\\s]+", "").trim();
        if (clean.isEmpty()) return "kak";
        String[] parts = clean.split("\\s+");
        return parts[0].substring(0, 1).toUpperCase(Locale.ROOT) + parts[0].substring(1).toLowerCase(Locale.ROOT);
    }

    private static String formatRupiah(int n) {
        return String.format(Locale.GERMANY, "%,d", n).replace('.', '.');
    }
}
