package id.replyforge.agent;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

public class OnboardingActivity extends AppCompatActivity {

    private TextView tvPermStatus;
    private Button btnGrantPerm, btnGrantBattery;
    private EditText etStoreName, etBankAccount, etCutoff;
    private Spinner spinnerCategory;
    private Button btnSaveStore, btnQuickDemo;
    private ReplyForgeDb db;

    private final String[] CATEGORIES = {
            "Stiker & Aksesoris Kreatif",
            "Fashion / Pakaian",
            "Makanan & Minuman / Kuliner",
            "Elektronik & Gadget",
            "Kustom / Lainnya"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        db = ReplyForgeDb.getInstance(this);

        if (db.isOnboardingCompleted()) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_onboarding);

        tvPermStatus = findViewById(R.id.tv_perm_status);
        btnGrantPerm = findViewById(R.id.btn_grant_perm);
        btnGrantBattery = findViewById(R.id.btn_grant_battery);
        Button btnTutorial = findViewById(R.id.btn_open_tutorial);
        etStoreName = findViewById(R.id.et_store_name);
        spinnerCategory = findViewById(R.id.spinner_category);
        etBankAccount = findViewById(R.id.et_bank_account);
        etCutoff = findViewById(R.id.et_cutoff);
        EditText etStoreCity = findViewById(R.id.et_store_city);
        btnSaveStore = findViewById(R.id.btn_save_store);
        btnQuickDemo = findViewById(R.id.btn_quick_demo);

        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, CATEGORIES);
        spinnerCategory.setAdapter(adapter);

        btnGrantPerm.setOnClickListener(v -> {
            try {
                startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
            } catch (Exception e) {
                Toast.makeText(this, "Buka Pengaturan > Akses Notifikasi", Toast.LENGTH_SHORT).show();
            }
        });

        btnGrantBattery.setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception e) {
                    try {
                        Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                        startActivity(intent);
                    } catch (Exception ignored) {}
                }
            }
        });

        if (btnTutorial != null) {
            btnTutorial.setOnClickListener(v -> showTutorialDialog());
        }

        btnSaveStore.setOnClickListener(v -> {
            String name = etStoreName.getText().toString().trim();
            String bank = etBankAccount.getText().toString().trim();
            String cutoff = etCutoff.getText().toString().trim();
            String city = etStoreCity != null ? etStoreCity.getText().toString().trim() : "Bandung";
            String cat = spinnerCategory.getSelectedItem() != null ? spinnerCategory.getSelectedItem().toString() : CATEGORIES[0];

            if (name.isEmpty()) {
                name = "Toko Saya";
            }
            if (cutoff.isEmpty()) {
                cutoff = "16.00";
            }
            if (city.isEmpty()) {
                city = "Bandung";
            }

            db.setSetting("storeName", name);
            db.setSetting("category", cat);
            db.setSetting("bankAccount", bank);
            db.setSetting("cutoff", cutoff);
            db.setSetting("storeCity", city);
            db.setSetting("mode", "autopilot");
            db.setSetting("tone", "santai");

            db.setOnboardingCompleted(true);
            Toast.makeText(this, "Toko " + name + " berhasil dibuat!", Toast.LENGTH_SHORT).show();
            startActivity(new Intent(this, MainActivity.class));
            finish();
        });

        btnQuickDemo.setOnClickListener(v -> {
            db.seedDemoStickeria();
            db.setOnboardingCompleted(true);
            Toast.makeText(this, "Profil demo Stickeria berhasil dimuat!", Toast.LENGTH_SHORT).show();
            startActivity(new Intent(this, MainActivity.class));
            finish();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        updatePermissionStatus();
    }

    private void updatePermissionStatus() {
        boolean granted = isNotificationServiceEnabled();
        boolean batteryGranted = isBatteryOptimizationIgnored();
        if (btnGrantBattery != null) {
            if (batteryGranted) {
                btnGrantBattery.setEnabled(false);
                btnGrantBattery.setText("✓ Izin Latar Belakang Sudah Diberikan");
            } else {
                btnGrantBattery.setEnabled(true);
                btnGrantBattery.setText("⚡ Izinkan Berjalan di Latar Belakang (1-Klik)");
            }
        }
        if (granted && batteryGranted) {
            ReplyForgeForegroundService.start(this);
            tvPermStatus.setText("● Agen aktif");
            tvPermStatus.setBackgroundTintList(ColorStateList.valueOf(0xFFFFFBEB));
            tvPermStatus.setTextColor(0xFF92400E);
            btnGrantPerm.setEnabled(false);
            btnGrantPerm.setText("✓ Izin Notifikasi Sudah Diberikan");
        } else if (granted) {
            tvPermStatus.setText("● Izin Aktif");
            tvPermStatus.setBackgroundTintList(ColorStateList.valueOf(0xFFFFFBEB));
            tvPermStatus.setTextColor(0xFF92400E);
            btnGrantPerm.setEnabled(false);
            btnGrantPerm.setText("✓ Izin Notifikasi Sudah Diberikan");
        } else {
            tvPermStatus.setText("Belum Aktif");
            tvPermStatus.setBackgroundTintList(ColorStateList.valueOf(0xFFFFFBEB));
            tvPermStatus.setTextColor(0xFFD97706);
            btnGrantPerm.setEnabled(true);
            btnGrantPerm.setText("Buka Pengaturan Akses Notifikasi");
        }
    }

    private boolean isBatteryOptimizationIgnored() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
    }

    private boolean isNotificationServiceEnabled() {
        String flat = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (!TextUtils.isEmpty(flat)) {
            String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && TextUtils.equals(getPackageName(), cn.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }

    private void showTutorialDialog() {
        showTutorialDialog(false, null);
    }

    private void showTutorialDialog(boolean isFinishingOnboarding, String storeName) {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_tutorial, null);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(!isFinishingOnboarding)
                .create();

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        Button btnAction = dialogView.findViewById(R.id.btn_tutorial_action);
        if (btnAction != null) {
            if (isFinishingOnboarding) {
                btnAction.setText("Mulai Operasikan Toko");
                btnAction.setOnClickListener(v -> {
                    db.setOnboardingCompleted(true);
                    String name = TextUtils.isEmpty(storeName) ? "Toko Anda" : storeName;
                    Toast.makeText(this, "Toko " + name + " berhasil dibuat!", Toast.LENGTH_SHORT).show();
                    dialog.dismiss();
                    startActivity(new Intent(this, MainActivity.class));
                    finish();
                });
            } else {
                btnAction.setText("Saya Mengerti");
                btnAction.setOnClickListener(v -> dialog.dismiss());
            }
        }

        dialog.show();
    }
}
