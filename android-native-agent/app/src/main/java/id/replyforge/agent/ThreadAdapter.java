package id.replyforge.agent;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import org.json.JSONArray;
import org.json.JSONObject;

public class ThreadAdapter extends RecyclerView.Adapter<ThreadAdapter.ViewHolder> {

    public interface OnThreadClickListener {
        void onThreadClick(String threadId, String buyer, String channel);
    }

    private final JSONArray items;
    private final OnThreadClickListener listener;

    public ThreadAdapter(JSONArray items, OnThreadClickListener listener) {
        this.items = items != null ? items : new JSONArray();
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_thread, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        try {
            JSONObject obj = items.getJSONObject(position);
            String threadId = obj.optString("id", "");
            String buyer = obj.optString("buyer", "Pembeli");
            String channel = obj.optString("channel", "whatsapp");
            String preview = obj.optString("last_message", "Percakapan aktif");

            Context context = holder.itemView.getContext();
            boolean isWhatsApp = "whatsapp".equalsIgnoreCase(channel);

            holder.tvBuyer.setText(buyer);
            holder.tvChannel.setText(isWhatsApp ? "WhatsApp" : "Shopee");
            holder.tvChannel.setBackground(ContextCompat.getDrawable(
                    context,
                    isWhatsApp ? R.drawable.bg_badge_channel_wa : R.drawable.bg_badge_channel_shopee));
            holder.tvChannel.setTextColor(ContextCompat.getColor(
                    context,
                    isWhatsApp ? R.color.channel_wa : R.color.channel_shopee));
            holder.tvChannel.setContentDescription(isWhatsApp ? "Percakapan WhatsApp" : "Percakapan Shopee");
            holder.itemView.setContentDescription((isWhatsApp ? "Percakapan WhatsApp: " : "Percakapan Shopee: ") + buyer);
            holder.tvPreview.setText(preview);

            holder.itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onThreadClick(threadId, buyer, channel);
                }
            });
        } catch (Exception ignored) {}
    }

    @Override
    public int getItemCount() {
        return items.length();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvBuyer, tvChannel, tvPreview;

        ViewHolder(View itemView) {
            super(itemView);
            tvBuyer = itemView.findViewById(R.id.tv_thread_buyer);
            tvChannel = itemView.findViewById(R.id.tv_thread_channel);
            tvPreview = itemView.findViewById(R.id.tv_thread_preview);
        }
    }
}
