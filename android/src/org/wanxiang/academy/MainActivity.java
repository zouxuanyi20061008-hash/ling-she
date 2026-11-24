package org.wanxiang.academy;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebMessage;
import android.webkit.WebMessagePort;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String ORIGIN = "https://" + HOST;
    private static final String PREFIX = "/assets/";
    private static final String ENTRY = ORIGIN + PREFIX + "index.html";
    private static final int OPEN_DOCUMENT = 1;
    private static final int SAVE_DOCUMENT = 2;
    private static final int EXPORT_LIMIT = 20 * 1024 * 1024;
    private static final String PAPER = "#F5F0E3";

    private WebView web;
    private ValueCallback<Uri[]> openFile;
    private WebMessagePort exportPort;
    private byte[] exportData;

    @Override public void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        boolean debug = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        WebView.setWebContentsDebuggingEnabled(debug);

        FrameLayout surface = new FrameLayout(this);
        surface.setBackgroundColor(Color.parseColor(PAPER));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor(PAPER));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setAllowFileAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                return isAssetOrigin(url) ? asset(url.getPath()) : null;
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.isForMainFrame() || navigate(request.getUrl());
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return navigate(Uri.parse(url));
            }

            @Override public void onPageFinished(WebView view, String url) {
                Uri current = Uri.parse(url);
                if (isAssetOrigin(current) && (PREFIX + "index.html").equals(current.getPath())) connectExport();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (openFile != null) openFile.onReceiveValue(null);
                openFile = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("*/*");
                try {
                    startActivityForResult(picker, OPEN_DOCUMENT);
                } catch (ActivityNotFoundException unavailable) {
                    openFile.onReceiveValue(null);
                    openFile = null;
                    message("此设备没有文件选择器。");
                }
                return true;
            }
        });

        surface.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(surface);
        fitSystemBars(surface);
        if (savedState == null || web.restoreState(savedState) == null) web.loadUrl(ENTRY + "#home");
    }

    private void fitSystemBars(View surface) {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            surface.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        getWindow().setStatusBarColor(Color.parseColor(PAPER));
        getWindow().setNavigationBarColor(Color.parseColor(PAPER));
        int appearance = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= 26) appearance |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        getWindow().getDecorView().setSystemUiVisibility(appearance);
        surface.requestApplyInsets();
    }

    private static boolean isAssetOrigin(Uri url) {
        return "https".equals(url.getScheme()) && HOST.equals(url.getEncodedAuthority());
    }

    private boolean navigate(Uri url) {
        if (isAssetOrigin(url)) return false;
        if ("https".equals(url.getScheme()) || "http".equals(url.getScheme())) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, url).addCategory(Intent.CATEGORY_BROWSABLE));
            } catch (ActivityNotFoundException unavailable) {
                message("找不到可打开链接的浏览器。");
            }
        }
        return true;
    }

    private WebResourceResponse asset(String path) {
        if (path == null || !path.startsWith(PREFIX) || path.contains("..") || path.contains("\\")) return missing();
        String name = path.substring(PREFIX.length());
        try {
            InputStream content = getAssets().open("web/" + name);
            Map<String, String> headers = new HashMap<>();
            headers.put("X-Content-Type-Options", "nosniff");
            if (name.endsWith(".html")) {
                headers.put("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
                    + "connect-src 'self' blob: https://meihua-yishu-web.onrender.com; img-src 'self' data: blob: https:; "
                    + "font-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
            }
            String mime = mimeType(name);
            String encoding = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") ? "UTF-8" : null;
            return new WebResourceResponse(mime, encoding, 200, "OK", headers, content);
        } catch (IOException absent) {
            return missing();
        }
    }

    private static String mimeType(String name) {
        if (name.endsWith(".html")) return "text/html";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".js")) return "application/javascript";
        if (name.endsWith(".json")) return "application/json";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private static WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0]));
    }

    private void connectExport() {
        if (exportPort != null) exportPort.close();
        WebMessagePort[] ports = web.createWebMessageChannel();
        exportPort = ports[0];
        exportPort.setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
            @Override public void onMessage(WebMessagePort port, WebMessage data) { saveBlob(data.getData()); }
        });
        web.postWebMessage(new WebMessage("lingshe:native-file-export", new WebMessagePort[] {ports[1]}), Uri.parse(ORIGIN));
    }

    private void saveBlob(String serialized) {
        if (exportData != null || serialized == null || serialized.length() > (EXPORT_LIMIT * 4 / 3) + 4096) {
            message("请先完成当前导出，或减少一次导出的内容。");
            return;
        }
        try {
            JSONObject entry = new JSONObject(serialized);
            String name = entry.getString("name").replaceAll("[\\p{Cntrl}/\\\\]", "_");
            String mime = entry.getString("mime");
            if (name.isEmpty() || name.length() > 160 || !(mime.equals("application/json") || mime.equals("text/csv") || mime.equals("text/plain"))) return;
            exportData = Base64.decode(entry.getString("base64"), Base64.DEFAULT);
            Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
            save.setType(mime).putExtra(Intent.EXTRA_TITLE, name);
            startActivityForResult(save, SAVE_DOCUMENT);
        } catch (Exception unusable) {
            exportData = null;
            message("文件导出未完成，请重试。");
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent intent) {
        super.onActivityResult(request, result, intent);
        if (request == OPEN_DOCUMENT && openFile != null) {
            openFile.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, intent));
            openFile = null;
        }
        if (request == SAVE_DOCUMENT) {
            byte[] data = exportData;
            exportData = null;
            if (result != RESULT_OK || intent == null || intent.getData() == null || data == null) return;
            try (OutputStream output = getContentResolver().openOutputStream(intent.getData(), "w")) {
                if (output == null) throw new IOException("No document stream");
                output.write(data);
                message("文件已保存。");
            } catch (IOException | SecurityException denied) {
                message("文件未保存，请重试。");
            }
        }
    }

    private void message(String text) { Toast.makeText(this, text, Toast.LENGTH_SHORT).show(); }

    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        web.saveState(state);
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (exportPort != null) exportPort.close();
        if (openFile != null) openFile.onReceiveValue(null);
        ((FrameLayout) web.getParent()).removeView(web);
        web.destroy();
        super.onDestroy();
    }
}
