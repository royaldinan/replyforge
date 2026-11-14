package id.replyforge.agent;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

public class ProductAdapter extends RecyclerView.Adapter<ProductAdapter.ViewHolder> {

    public interface OnStockAdjustListener {
        void onAdjust(String sku, int delta);
    }

    private final JSONArray products;
    private final OnStockAdjustListener listener;

    public ProductAdapter(JSONArray products, OnStockAdjustListener listener) {
        this.products = products != null ? products : new JSONArray();
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_product, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        try {
            JSONObject p = products.getJSONObject(position);
            String sku = p.optString("sku", "");
            String name = p.optString("name", "");
            int price = p.optInt("price", 0);
            int hpp = p.optInt("hpp", 0);
            int stock = p.optInt("stock", 0);
            String unit = p.optString("unit", "pcs");

            int margin = price > 0 ? (int) Math.round(((price - hpp) / (double) price) * 100) : 0;

            holder.tvName.setText(name);
            holder.tvSku.setText("SKU: " + sku);
            holder.tvStock.setText(stock + " " + unit);
            holder.tvPrice.setText("Harga: Rp" + String.format(Locale.GERMANY, "%,d", price));
            holder.tvMargin.setText("HPP: Rp" + String.format(Locale.GERMANY, "%,d", hpp) + " (Margin " + margin + "%)");

            holder.btnMinus1.setOnClickListener(v -> {
                if (listener != null) listener.onAdjust(sku, -1);
            });
            holder.btnPlus1.setOnClickListener(v -> {
                if (listener != null) listener.onAdjust(sku, 1);
            });
            holder.btnPlus10.setOnClickListener(v -> {
                if (listener != null) listener.onAdjust(sku, 10);
            });
        } catch (Exception ignored) {}
    }

    @Override
    public int getItemCount() {
        return products.length();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvName, tvSku, tvStock, tvPrice, tvMargin;
        Button btnMinus1, btnPlus1, btnPlus10;

        ViewHolder(View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tv_prod_name);
            tvSku = itemView.findViewById(R.id.tv_prod_sku);
            tvStock = itemView.findViewById(R.id.tv_prod_stock);
            tvPrice = itemView.findViewById(R.id.tv_prod_price);
            tvMargin = itemView.findViewById(R.id.tv_prod_margin);
            btnMinus1 = itemView.findViewById(R.id.btn_step_minus_1);
            btnPlus1 = itemView.findViewById(R.id.btn_step_plus_1);
            btnPlus10 = itemView.findViewById(R.id.btn_step_plus_10);
        }
    }
}
