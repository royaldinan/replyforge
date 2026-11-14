package id.replyforge.agent;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootCompletedReceiver extends BroadcastReceiver {

    private static final String TAG = "ReplyForgeBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            return;
        }
        try {
            ReplyForgeForegroundService.start(context);
            Log.i(TAG, "Foreground service start requested after " + action);
        } catch (Exception e) {
            // OEM restrictions (SecurityException / ForegroundServiceStartNotAllowedException): never crash on boot.
            Log.w(TAG, "Could not start foreground service after " + action, e);
        }
    }
}
