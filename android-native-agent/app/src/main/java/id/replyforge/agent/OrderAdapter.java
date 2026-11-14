package id.replyforge.agent;

import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

public class OrderAdapter extends RecyclerView.Adapter<OrderAdapter.ViewHolder> {

    public interface OnOrderActionListener {
        void onConfirmPaid(int orderId);
        void onCancelOrder(int orderId);
    }

    private final JSONArray orders;
    private final OnOrderActionListener listener;

    public OrderAdapter(JSONArray orders, OnOrderActionListener listener) {
        this.orders = orders != null ? orders : new JSONArray();
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_order, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        try {
            JSONObject o = orders.getJSONObject(position);
            int id = o.optInt("id", 0);
            String code = o.optString("code", "");
            String buyer = o.optString("buyer", "Pembeli");
            String channel = o.optString("channel", "whatsapp");
            int total = o.optInt("total", 0);
            String status = o.optString("status", "reserved");

            JSONArray items = o.optJSONArray("items");
            StringBuilder itemsDesc = new StringBuilder();
            if (items != null) {
                for (int i = 0; i < items.length(); i++) {
                    JSONObject it = items.getJSONObject(i);
                    if (itemsDesc.length() > 0) itemsDesc.append(", ");
                    itemsDesc.append(it.optInt("quantity", 1)).append("x ").append(it.optString("sku", "Item"));
                }
            } else {
                String raw = o.optString("items", "");
                if (!raw.isEmpty()) {
                    itemsDesc.append(raw);
                }
            }

            holder.tvCode.setText(code);
            holder.tvBuyer.setText(buyer + " · " + ("whatsapp".equalsIgnoreCase(channel) ? "WhatsApp" : "Shopee"));
            holder.tvTotal.setText("Rp" + String.format(Locale.GERMANY, "%,d", total));
            holder.tvItems.setText(itemsDesc.length() > 0 ? itemsDesc.toString() : "Detail pesanan");

            if ("paid".equalsIgnoreCase(status)) {
                holder.tvStatus.setText("Lunas & Terkirim");
                holder.tvStatus.setBackgroundTintList(ColorStateList.valueOf(0xFFECFDF5));
                holder.tvStatus.setTextColor(0xFF059669);
                holder.llActions.setVisibility(View.GONE);
            } else if ("cancelled".equalsIgnoreCase(status)) {
                holder.tvStatus.setText("Dibatalkan");
                holder.tvStatus.setBackgroundTintList(ColorStateList.valueOf(0xFFFFFFFF));
                holder.tvStatus.setTextColor(0xFF64748B);
                holder.llActions.setVisibility(View.GONE);
            } else if ("lead".equalsIgnoreCase(status)) {
                holder.tvStatus.setText("Calon Pembeli");
                holder.tvStatus.setBackgroundTintList(ColorStateList.valueOf(0xFFEFF6FF));
                holder.tvStatus.setTextColor(0xFF2563EB);
                holder.llActions.setVisibility(View.VISIBLE);
            } else {
                holder.tvStatus.setText("Menunggu Bayar");
                holder.tvStatus.setBackgroundTintList(ColorStateList.valueOf(0xFFFFFBEB));
                holder.tvStatus.setTextColor(0xFFD97706);
                holder.llActions.setVisibility(View.VISIBLE);
            }

            holder.btnPaid.setOnClickListener(v -> {
                if (listener != null) listener.onConfirmPaid(id);
            });

            holder.btnCancel.setOnClickListener(v -> {
                if (listener != null) listener.onCancelOrder(id);
            });

        } catch (Exception ignored) {}
    }

    @Override
    public int getItemCount() {
        return orders.length();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvCode, tvStatus, tvBuyer, tvTotal, tvItems;
        LinearLayout llActions;
        Button btnPaid, btnCancel;

        ViewHolder(View itemView) {
            super(itemView);
            tvCode = itemView.findViewById(R.id.tv_order_code);
            tvStatus = itemView.findViewById(R.id.tv_order_status);
            tvBuyer = itemView.findViewById(R.id.tv_order_buyer);
            tvTotal = itemView.findViewById(R.id.tv_order_total);
            tvItems = itemView.findViewById(R.id.tv_order_items);
            llActions = itemView.findViewById(R.id.ll_order_actions);
            btnPaid = itemView.findViewById(R.id.btn_order_item_paid);
            btnCancel = itemView.findViewById(R.id.btn_order_item_cancel);
        }
    }
}
