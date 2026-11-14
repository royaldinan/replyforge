package id.replyforge.agent;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

/**
 * Owns ONLY the foreground (dataSync) lifecycle of the agent process.
 * Notification-listener logic stays in {@link ReplyForgeNotificationService}.
 */
public class ReplyForgeForegroundService extends Service {

    private static final String TAG = "ReplyForgeFgService";
    private static final String CHANNEL_ID = "replyforge_agent_low";
    private static final int NOTIF_ID = 4101;
    private static final int RESTART_REQUEST_CODE = 4102;
    private static final long RESTART_DELAY_MS = 1000L;

    public static void start(Context ctx) {
        ContextCompat.startForegroundService(ctx, new Intent(ctx, ReplyForgeForegroundService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        Notification notification = buildNotification();
        ServiceCompat.startForeground(this, NOTIF_ID, notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am == null) {
            Log.w(TAG, "onTaskRemoved: AlarmManager unavailable, restart not scheduled");
            return;
        }
        PendingIntent restart = PendingIntent.getForegroundService(
                this, RESTART_REQUEST_CODE,
                new Intent(this, ReplyForgeForegroundService.class),
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long triggerAt = SystemClock.elapsedRealtime() + RESTART_DELAY_MS;
        try {
            am.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, restart);
            Log.i(TAG, "onTaskRemoved: exact restart alarm scheduled");
        } catch (SecurityException e) {
            Log.w(TAG, "onTaskRemoved: exact alarm denied, falling back to inexact", e);
            am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, restart);
            Log.i(TAG, "onTaskRemoved: inexact restart alarm scheduled");
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "ReplyForge Agent", NotificationManager.IMPORTANCE_LOW);
        nm.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        PendingIntent content = PendingIntent.getActivity(
                this, 0,
                new Intent(this, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("ReplyForge aktif")
                .setContentText("Agent memantau notifikasi WhatsApp Business dan Shopee untuk membalas pembeli.")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(
                        "Agent memantau notifikasi WhatsApp Business dan Shopee untuk membalas pembeli."))
                .setContentIntent(content)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();
    }
}
