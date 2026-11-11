package id.replyforge.agent;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

/**
 * 100% Standalone Native Android Container for ReplyForge.
 * 
 * - Internal HTTP Loopback Server: Serves Web UI & REST APIs on 127.0.0.1:8088
 * - Offline Asset Fallback: Instant failover to file:///android_asset/dist/index.html
 * - Zero USB/Laptop Tethering: Runs autonomously on device.
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "ReplyForgeApp";
    private static final String TARGET_URL = "http://127.0.0.1:8088/?mobile=1";
    private static final String FALLBACK_URL = "file:///android_asset/dist/index.html?mobile=1";

    private WebView webView;
    private LinearLayout errorView;
    private ProgressBar progressBar;
    private TextView errorText;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean isLoaded = false;
    private boolean hasTriedFallback = false;

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Allow wake & display on lockscreen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }

        // Start embedded zero-latency standalone server
        ReplyForgeLocalServer.getInstance(this).start();

        // Create root layout programmatically (Sunlit Warm Commercial #FAF8F5)
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFFFAF8F5);

        // Setup WebView
        webView = new WebView(this);
        webView.setBackgroundColor(0xFFFAF8F5);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUserAgentString(settings.getUserAgentString() + " ReplyForgeAndroid/4.0-Standalone");
        webView.addJavascriptInterface(new ReplyForgeJsBridge(), "ReplyForgeAndroid");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d("ReplyForgeWeb", cm.message() + " [" + cm.sourceId() + ":" + cm.lineNumber() + "]");
                return true;
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                Log.i(TAG, "Loading URL: " + url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                Log.i(TAG, "Loaded successfully: " + url);
                isLoaded = true;
                errorView.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    Log.w(TAG, "Main frame failed to load: " + error.getDescription());
                    if (!hasTriedFallback) {
                        hasTriedFallback = true;
                        Log.i(TAG, "Instant Failover: Loading local assets bundle directly: " + FALLBACK_URL);
                        view.loadUrl(FALLBACK_URL);
                    } else {
                        showConnectingState();
                    }
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }
        });

        // Setup Connecting / Fallback View
        errorView = new LinearLayout(this);
        errorView.setOrientation(LinearLayout.VERTICAL);
        errorView.setGravity(android.view.Gravity.CENTER);
        errorView.setPadding(48, 48, 48, 48);

        progressBar = new ProgressBar(this);
        errorText = new TextView(this);
        errorText.setTextColor(0xFF18181B);
        errorText.setTextSize(15f);
        errorText.setGravity(android.view.Gravity.CENTER);
        errorText.setText("Memuat ReplyForge Standalone Agent...");
        errorText.setPadding(0, 32, 0, 0);

        errorView.addView(progressBar);
        errorView.addView(errorText);

        root.addView(webView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(errorView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        setContentView(root);

        // Handle Back button
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        // Initial Load
        loadTarget();

        // Check Notification Permission
        checkNotificationListenerPermission();
    }

    private void loadTarget() {
        webView.loadUrl(TARGET_URL);
    }

    private void showConnectingState() {
        if (!isLoaded) {
            errorView.setVisibility(View.VISIBLE);
            webView.setVisibility(View.GONE);
            handler.postDelayed(this::loadTarget, 2000);
        }
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

    private void checkNotificationListenerPermission() {
        if (!isNotificationServiceEnabled()) {
            Log.w(TAG, "Notification listener not enabled yet. Can be granted via settings.");
        } else {
            Log.i(TAG, "Notification listener is ACTIVE and AUTHORIZED!");
        }
    }

    private class ReplyForgeJsBridge {
        @JavascriptInterface
        public boolean isNotificationPermissionGranted() {
            return isNotificationServiceEnabled();
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            handler.post(() -> {
                try {
                    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "Failed opening notification listener settings", e);
                }
            });
        }

        @JavascriptInterface
        public void triggerAnomalyAlert(String title, String body) {
            handler.post(() -> {
                String msg = "PERINGATAN PENJUAL: " + (title != null ? title : "") + " - " + (body != null ? body : "");
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
            });
        }

        @JavascriptInterface
        public void dispatchReply(String buyer, String text) {
            ReplyForgeNotificationService.dispatchManualReply(buyer, text);
        }

        @JavascriptInterface
        public boolean isStandalone() {
            return true;
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "4.0-Standalone";
        }
    }
}
