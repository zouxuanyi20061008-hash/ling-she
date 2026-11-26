param(
    [Parameter(Mandatory)][string]$Output,
    [Parameter(Mandatory)][string]$WebView2Package,
    [string]$WorkDir = (Join-Path ([IO.Path]::GetTempPath()) 'wanxiang-windows')
)

$ErrorActionPreference = 'Stop'
$destination = [IO.Path]::GetFullPath($Output)
if ([IO.Path]::GetExtension($destination) -ne '.exe') { throw 'Output must have an .exe extension.' }
$packagePath = (Resolve-Path -LiteralPath $WebView2Package).ProviderPath
$build = [IO.Path]::GetFullPath($WorkDir)
$frontend = Join-Path (Split-Path $PSScriptRoot -Parent) 'frontend'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$null = New-Item -ItemType Directory -Force -Path $build, (Split-Path $destination -Parent)

$entry = Join-Path $build 'academy.html'
Push-Location $frontend
try {
    & npm.cmd run build:html -- --output $entry --api-url https://meihua-yishu-web.onrender.com
    if ($LASTEXITCODE -ne 0) { throw 'The frontend build failed.' }
} finally { Pop-Location }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$members = @{
    'Microsoft.Web.WebView2.Core.dll' = 'lib/net462/Microsoft.Web.WebView2.Core.dll'
    'Microsoft.Web.WebView2.WinForms.dll' = 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
    'WebView2Loader.dll' = 'runtimes/win-x64/native/WebView2Loader.dll'
    'WebView2-LICENSE.txt' = 'LICENSE.txt'
}
$archive = [IO.Compression.ZipFile]::OpenRead($packagePath)
try {
    foreach ($name in $members.Keys) {
        $member = $archive.GetEntry($members[$name])
        if (-not $member) { throw "Missing WebView2 SDK file: $($members[$name])" }
        [IO.Compression.ZipFileExtensions]::ExtractToFile($member, (Join-Path $build $name), $true)
    }
} finally { $archive.Dispose() }

$compressed = Join-Path $build 'academy.html.gz'
$inputFile = [IO.File]::OpenRead($entry)
try {
    $outputFile = [IO.File]::Create($compressed)
    try {
        $gzip = [IO.Compression.GZipStream]::new($outputFile, [IO.Compression.CompressionLevel]::Optimal)
        try { $inputFile.CopyTo($gzip) } finally { $gzip.Dispose() }
    } finally { $outputFile.Dispose() }
} finally { $inputFile.Dispose() }

foreach ($name in @('academy.html', 'WebView2Loader.dll')) {
    $digest = (Get-FileHash -LiteralPath (Join-Path $build $name) -Algorithm SHA256).Hash
    [IO.File]::WriteAllText((Join-Path $build "$name.sha256"), $digest)
}

$inputs = @(
    '/nologo', '/utf8output', '/codepage:65001', '/target:winexe', '/platform:x64', '/optimize+', "/out:$destination",
    '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll', '/reference:System.IO.Compression.dll',
    "/reference:$(Join-Path $build 'Microsoft.Web.WebView2.Core.dll')",
    "/reference:$(Join-Path $build 'Microsoft.Web.WebView2.WinForms.dll')",
    "/resource:$compressed,academy.html",
    (Join-Path $PSScriptRoot 'Program.cs')
)
foreach ($name in @($members.Keys) + @('academy.html.sha256', 'WebView2Loader.dll.sha256')) {
    $inputs += "/resource:$(Join-Path $build $name),$name"
}
& $compiler @inputs
if ($LASTEXITCODE -ne 0) { throw 'The Windows build failed.' }
Get-FileHash -LiteralPath $destination -Algorithm SHA256
