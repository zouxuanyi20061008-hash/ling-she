param(
    [Parameter(Mandatory)][string]$Output,
    [Parameter(Mandatory)][string]$SdkRoot,
    [string]$JdkRoot = $env:JAVA_HOME,
    [string]$BuildTools = '36.0.0',
    [string]$Platform = 'android-36.1',
    [string]$VersionName = '1.0.0',
    [int]$VersionCode = 1,
    [string]$WorkDir = (Join-Path ([IO.Path]::GetTempPath()) 'wanxiang-android'),
    [string]$SigningDir,
    [switch]$DebugWebView
)

$ErrorActionPreference = 'Stop'
$repoPath = Split-Path $PSScriptRoot -Parent
$frontendPath = Join-Path $repoPath 'frontend'
$renderApi = 'https://meihua-yishu-web.onrender.com'
$apkDestination = [IO.Path]::GetFullPath($Output)
$packageWork = [IO.Path]::GetFullPath($WorkDir)
if (-not $SigningDir) { $SigningDir = Join-Path $packageWork 'signing' }
$signingLocation = [IO.Path]::GetFullPath($SigningDir)
$packageBuild = Join-Path $packageWork 'build'
$assetPath = Join-Path $packageBuild 'assets'
$webPath = Join-Path $assetPath 'web'
$sdkTools = Join-Path $SdkRoot "build-tools/$BuildTools"
$androidJar = Join-Path $SdkRoot "platforms/$Platform/android.jar"
$jdkBin = Join-Path $JdkRoot 'bin'
$java = Join-Path $jdkBin 'java.exe'
$javac = Join-Path $jdkBin 'javac.exe'
$jar = Join-Path $jdkBin 'jar.exe'
$keytool = Join-Path $jdkBin 'keytool.exe'
$aapt2 = Join-Path $sdkTools 'aapt2.exe'
$align = Join-Path $sdkTools 'zipalign.exe'
$d8 = Join-Path $sdkTools 'lib/d8.jar'
$apksigner = Join-Path $sdkTools 'lib/apksigner.jar'

function Invoke-Checked([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$(Split-Path $Executable -Leaf) exited with status $LASTEXITCODE" }
}

if ([IO.Path]::GetExtension($apkDestination) -ne '.apk') { throw 'Output must have an .apk extension.' }
foreach ($tool in @($java, $javac, $jar, $keytool, $aapt2, $align, $d8, $apksigner, $androidJar)) {
    if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) { throw "Required Android build tool unavailable: $tool" }
}

$null = New-Item -ItemType Directory -Force -Path $packageBuild, $assetPath, $signingLocation, (Split-Path $apkDestination -Parent)
$priorApi = $env:VITE_API_URL
$priorMode = $env:VITE_PACKAGED_APP
Push-Location $frontendPath
try {
    $env:VITE_API_URL = $renderApi
    $env:VITE_PACKAGED_APP = '1'
    Invoke-Checked 'npm.cmd' @('run', 'build', '--', '--base=./', '--outDir', $webPath, '--emptyOutDir')
} finally {
    $env:VITE_API_URL = $priorApi
    $env:VITE_PACKAGED_APP = $priorMode
    Pop-Location
}

$webEntry = Join-Path $webPath 'index.html'
$page = [IO.File]::ReadAllText($webEntry)
if (-not $page.Contains('</head>')) { throw 'The frontend build did not provide an HTML head.' }
$page = $page.Replace('</head>', '<script src="./android-file-export.js"></script></head>')
[IO.File]::WriteAllText($webEntry, $page, [Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'android-file-export.js') -Destination $webPath

$signer = Join-Path $signingLocation 'academy.p12'
$passFile = Join-Path $signingLocation 'academy.pass'
if (-not (Test-Path -LiteralPath $signer)) {
    if (Test-Path -LiteralPath $passFile) { throw 'The signing directory contains a password without its key.' }
    $randomBytes = New-Object byte[] 24
    $randomSource = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $randomSource.GetBytes($randomBytes) } finally { $randomSource.Dispose() }
    [IO.File]::WriteAllText($passFile, [Convert]::ToBase64String($randomBytes))
    $env:LINGSHE_ANDROID_SIGN_PASS = [IO.File]::ReadAllText($passFile)
    try {
        Invoke-Checked $keytool @('-genkeypair', '-keystore', $signer, '-storetype', 'PKCS12', '-alias', 'wanxiang',
            '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-dname', 'CN=Wanxiang Academy',
            '-storepass:env', 'LINGSHE_ANDROID_SIGN_PASS', '-noprompt')
    } finally { $env:LINGSHE_ANDROID_SIGN_PASS = $null }
}
if (-not (Test-Path -LiteralPath $passFile -PathType Leaf)) { throw 'The existing signing key needs its original password file.' }

Push-Location $packageBuild
try {
    $null = New-Item -ItemType Directory -Force -Path 'classes', 'dex'
    $manifestSource = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'AndroidManifest.xml'))
    if ($DebugWebView) { $manifestSource = $manifestSource.Replace('<application ', '<application android:debuggable="true" ') }
    [IO.File]::WriteAllText((Join-Path $packageBuild 'AndroidManifest.xml'), $manifestSource, [Text.UTF8Encoding]::new($false))
    $resourcePath = Join-Path $PSScriptRoot 'res'
    Copy-Item -LiteralPath $resourcePath -Destination '.' -Recurse -Force
    Invoke-Checked $aapt2 @('compile', '--dir', 'res', '-o', 'resources.zip')
    Invoke-Checked $aapt2 @('link', '-o', 'unsigned.apk', '-I', $androidJar, '--manifest', 'AndroidManifest.xml',
        '--min-sdk-version', '26', '--target-sdk-version', '35', '--version-code', "$VersionCode", '--version-name', $VersionName,
        'resources.zip')
    $activity = Join-Path $PSScriptRoot 'src/org/wanxiang/academy/MainActivity.java'
    Invoke-Checked $javac @('-encoding', 'UTF-8', '-source', '8', '-target', '8', '-Xlint:-options', '-cp', $androidJar, '-d', 'classes', $activity)
    Invoke-Checked $jar @('cf', 'classes.jar', '-C', 'classes', '.')
    Invoke-Checked $java @('-cp', $d8, 'com.android.tools.r8.D8', '--min-api', '26', '--lib', $androidJar, '--output', 'dex', 'classes.jar')

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $apkArchive = [IO.Compression.ZipFile]::Open((Join-Path $packageBuild 'unsigned.apk'), [IO.Compression.ZipArchiveMode]::Update)
    try {
        $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($apkArchive, (Join-Path $packageBuild 'dex/classes.dex'), 'classes.dex')
        foreach ($asset in Get-ChildItem -LiteralPath $assetPath -Recurse -File) {
            # Android's AssetManager looks up ZIP entries with slash separators, including on builds made on Windows.
            $entry = 'assets/' + $asset.FullName.Substring($assetPath.Length + 1).Replace('\', '/')
            $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($apkArchive, $asset.FullName, $entry)
        }
        if (-not $apkArchive.GetEntry('assets/web/index.html')) { throw 'Missing APK web entry.' }
    } finally { $apkArchive.Dispose() }
    Invoke-Checked $align @('-f', '4', 'unsigned.apk', 'aligned.apk')
    $env:LINGSHE_ANDROID_SIGN_PASS = [IO.File]::ReadAllText($passFile).Trim()
    try {
        Invoke-Checked $java @('-jar', $apksigner, 'sign', '--v4-signing-enabled', 'false', '--ks', $signer, '--ks-key-alias', 'wanxiang',
            '--ks-pass', 'env:LINGSHE_ANDROID_SIGN_PASS', '--out', $apkDestination, 'aligned.apk')
    } finally { $env:LINGSHE_ANDROID_SIGN_PASS = $null }
    Invoke-Checked $java @('-jar', $apksigner, 'verify', '--verbose', $apkDestination)
    Get-FileHash -Algorithm SHA256 -LiteralPath $apkDestination
} finally { Pop-Location }
