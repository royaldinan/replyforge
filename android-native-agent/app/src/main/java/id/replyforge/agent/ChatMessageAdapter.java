package id.replyforge.agent;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class ChatMessageAdapter extends RecyclerView.Adapter<ChatMessageAdapter.ViewHolder> {

    private final JSONArray messages;
    private final String defaultChannel;
    private final SimpleDateFormat timeFormat = new SimpleDateFormat("HH.mm", Locale.ROOT);

    public ChatMessageAdapter(JSONArray messages) {
        this(messages, "whatsapp");
    }

    public ChatMessageAdapter(JSONArray messages, String defaultChannel) {
        this.messages = messages != null ? messages : new JSONArray();
        this.defaultChannel = defaultChannel != null ? defaultChannel : "whatsapp";
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_chat_message, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        try {
            JSONObject obj = messages.getJSONObject(position);
            String direction = obj.optString("direction", "in");
            String text = obj.optString("text", "");
            long createdAt = obj.optLong("created_at", System.currentTimeMillis());
            String timeStr = timeFormat.format(new Date(createdAt));

            String msgChannel = obj.optString("channel", defaultChannel);
            if (msgChannel == null || msgChannel.isEmpty()) {
                msgChannel = defaultChannel;
            }
            boolean isWhatsApp = "whatsapp".equalsIgnoreCase(msgChannel);

            if ("in".equalsIgnoreCase(direction)) {
                holder.llBuyer.setVisibility(View.VISIBLE);
                holder.llMine.setVisibility(View.GONE);
                holder.llBuyer.setBackground(ContextCompat.getDrawable(
                        holder.itemView.getContext(),
                        isWhatsApp ? R.drawable.bg_chat_buyer_wa : R.drawable.bg_chat_buyer_shopee));
                holder.tvBuyerText.setText(text);
                holder.tvBuyerTime.setText(timeStr);
            } else {
                holder.llBuyer.setVisibility(View.GONE);
                holder.llMine.setVisibility(View.VISIBLE);
                holder.tvMineText.setText(text);
                holder.tvMineTime.setText(timeStr + (isWhatsApp
                        ? " · AI Auto-Reply"
                        : " · Draf Copilot (belum terkirim)"));
            }
        } catch (Exception ignored) {}
    }

    @Override
    public int getItemCount() {
        return messages.length();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        LinearLayout llBuyer, llMine;
        TextView tvBuyerText, tvBuyerTime;
        TextView tvMineText, tvMineTime;

        ViewHolder(View itemView) {
            super(itemView);
            llBuyer = itemView.findViewById(R.id.ll_msg_buyer);
            llMine = itemView.findViewById(R.id.ll_msg_mine);
            tvBuyerText = itemView.findViewById(R.id.tv_msg_buyer_text);
            tvBuyerTime = itemView.findViewById(R.id.tv_msg_buyer_time);
            tvMineText = itemView.findViewById(R.id.tv_msg_mine_text);
            tvMineTime = itemView.findViewById(R.id.tv_msg_mine_time);
        }
    }
}
