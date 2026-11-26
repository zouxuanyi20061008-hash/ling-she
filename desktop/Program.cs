using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("万象书院")]
[assembly: AssemblyProduct("万象书院")]
[assembly: AssemblyDescription("万象书院 · 八门术数互动研习")]
[assembly: AssemblyVersion("1.0.2.0")]
[assembly: AssemblyFileVersion("1.0.2.0")]

internal static class Program
{
    private static readonly Assembly Bundle = Assembly.GetExecutingAssembly();

    [STAThread]
    private static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        AppDomain.CurrentDomain.AssemblyResolve += ResolveWebViewAssembly;
        try
        {
            var directory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "WanxiangAcademy");
            Directory.CreateDirectory(directory);
            var entry = Path.Combine(directory, "academy.html");
            using (var mutex = new Mutex(false, @"Local\WanxiangAcademy-Resources"))
            {
                bool locked;
                try { locked = mutex.WaitOne(TimeSpan.FromSeconds(15)); }
                catch (AbandonedMutexException) { locked = true; }
                if (!locked) throw new IOException("万象书院正在准备文件，请稍后重新打开。");
                try
                {
                    InstallResource("academy.html", entry, true);
                    InstallResource("WebView2Loader.dll", Path.Combine(directory, "WebView2Loader.dll"), false);
                }
                finally { mutex.ReleaseMutex(); }
            }
            OpenAcademy(entry, directory);
        }
        catch (Exception failure)
        {
            MessageBox.Show("万象书院启动失败。\n\n" + failure.Message, "万象书院",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    [System.Runtime.CompilerServices.MethodImpl(System.Runtime.CompilerServices.MethodImplOptions.NoInlining)]
    private static void OpenAcademy(string entry, string directory)
    {
        CoreWebView2Environment.SetLoaderDllFolderPath(directory);
        using (var window = new AcademyWindow(entry, Path.Combine(directory, "Profile")))
            Application.Run(window);
    }

    private static Assembly ResolveWebViewAssembly(object sender, ResolveEventArgs args)
    {
        var name = new AssemblyName(args.Name).Name;
        if (name != "Microsoft.Web.WebView2.Core" && name != "Microsoft.Web.WebView2.WinForms") return null;
        using (var resource = Bundle.GetManifestResourceStream(name + ".dll"))
        using (var buffer = new MemoryStream())
        {
            resource.CopyTo(buffer);
            return Assembly.Load(buffer.ToArray());
        }
    }

    private static void InstallResource(string name, string destination, bool compressed)
    {
        if (File.Exists(destination))
        {
            using (var checksum = Bundle.GetManifestResourceStream(name + ".sha256"))
            using (var expected = new StreamReader(checksum))
            using (var actual = File.OpenRead(destination))
            using (var hash = SHA256.Create())
            {
                if (String.Equals(expected.ReadToEnd().Trim(), BitConverter.ToString(hash.ComputeHash(actual)).Replace("-", ""),
                    StringComparison.OrdinalIgnoreCase)) return;
            }
        }
        var scratch = destination + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            using (var resource = Bundle.GetManifestResourceStream(name))
            using (var source = compressed ? (Stream)new GZipStream(resource, CompressionMode.Decompress) : resource)
            using (var file = new FileStream(scratch, FileMode.CreateNew, FileAccess.Write))
                source.CopyTo(file);
            if (File.Exists(destination)) File.Replace(scratch, destination, null);
            else File.Move(scratch, destination);
        }
        finally { if (File.Exists(scratch)) File.Delete(scratch); }
    }
}

internal sealed class AcademyWindow : Form
{
    private readonly string entry;
    private readonly string profile;
    private readonly WebView2 browser;

    internal AcademyWindow(string entry, string profile)
    {
        this.entry = entry;
        this.profile = profile;
        Text = "万象书院";
        Icon = Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location);
        StartPosition = FormStartPosition.CenterScreen;
        AutoScaleMode = AutoScaleMode.Dpi;
        BackColor = Color.FromArgb(249, 240, 228);
        var area = Screen.PrimaryScreen.WorkingArea;
        ClientSize = new Size(Math.Min(1160, area.Width - 44), Math.Min(780, area.Height - 65));
        MinimumSize = new Size(360, 480);
        Controls.Add(new Label {
            Text = "正在打开万象书院…", ForeColor = Color.FromArgb(95, 42, 34),
            Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter
        });
        browser = new WebView2 { Dock = DockStyle.Fill, Visible = false };
        Controls.Add(browser);
        Shown += StartBrowser;
    }

    private async void StartBrowser(object sender, EventArgs args)
    {
        try
        {
            var environment = await CoreWebView2Environment.CreateAsync(null, profile);
            await browser.EnsureCoreWebView2Async(environment);
            if (IsDisposed) return;
            var core = browser.CoreWebView2;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsPasswordAutosaveEnabled = false;
            core.Settings.IsGeneralAutofillEnabled = false;
            core.NavigationStarting += delegate(object _, CoreWebView2NavigationStartingEventArgs navigation)
            {
                Uri uri;
                if (Uri.TryCreate(navigation.Uri, UriKind.Absolute, out uri) && uri.IsFile &&
                    String.Equals(uri.LocalPath, entry, StringComparison.OrdinalIgnoreCase)) return;
                navigation.Cancel = true;
                OpenExternal(navigation.Uri);
            };
            core.NewWindowRequested += delegate(object _, CoreWebView2NewWindowRequestedEventArgs popup)
            {
                // Bundled classic illustrations open their local Blob URL in a viewer.
                if (popup.IsUserInitiated && popup.Uri.StartsWith("blob:", StringComparison.OrdinalIgnoreCase)) return;
                popup.Handled = true;
                OpenExternal(popup.Uri);
            };
            core.NavigationCompleted += delegate { browser.Visible = true; browser.BringToFront(); };
            core.Navigate(new Uri(entry).AbsoluteUri + "#home");
        }
        catch (Exception failure)
        {
            if (IsDisposed) return;
            MessageBox.Show(this, "请确认已安装 Microsoft Edge WebView2 Runtime 后重试。\n\n" + failure.Message,
                "万象书院", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    private static void OpenExternal(string address)
    {
        Uri uri;
        if (!Uri.TryCreate(address, UriKind.Absolute, out uri) || uri.Scheme != Uri.UriSchemeHttps) return;
        try { Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); }
        catch (System.ComponentModel.Win32Exception) { }
    }
}
