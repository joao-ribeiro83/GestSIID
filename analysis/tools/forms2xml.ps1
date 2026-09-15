# Converts every .fmb/.mmb in dev\T and dev\P to XML with Oracle's Forms2XML (no DB connection needed)
# and moves the XML into analysis\forms-xml\<set>\. Masks the password literals the ON-LOGON trigger carries.
# Usage (pwsh 7):  pwsh -NoProfile -File analysis\tools\forms2xml.ps1 [-OracleHome I:\Middleware\Oracle_Home] [-Sets T,P]
param(
  [string]$OracleHome = 'I:\Middleware\Oracle_Home',
  [string[]]$Sets = @('T', 'P')
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$env:ORACLE_HOME = $OracleHome
$env:PATH = "$OracleHome\bin;$env:PATH"          # frmjapi.dll and friends
# Without these, accented Portuguese characters come out as '?' in the XML (JDAPI converts to the client charset).
$env:NLS_LANG = 'PORTUGUESE_PORTUGAL.AL32UTF8'
$javaOpts = @('-Dfile.encoding=UTF-8')
$java = "$OracleHome\oracle_common\jdk\bin\java.exe"
$cp = "$OracleHome\jlib\frmxmltools.jar;$OracleHome\jlib\frmjdapi.jar;$OracleHome\oracle_common\modules\oracle.xdk\xmlparserv2.jar"
if (-not (Test-Path $java)) { throw "Java not found at $java" }

foreach ($set in $Sets) {
  $src = Join-Path $repo "dev\$set"
  $dst = Join-Path $repo "analysis\forms-xml\$set"
  New-Item -ItemType Directory -Force $dst | Out-Null
  Get-ChildItem $src -File | Where-Object { $_.Extension -in '.fmb', '.mmb' -and $_.Name -notlike 'webutil*' } | ForEach-Object {
    $out = & $java @javaOpts -classpath $cp oracle.forms.util.xmltools.Forms2XML OVERWRITE=YES USE_PROPERTY_IDS=NO $_.FullName 2>&1
    $ok = ($out | Select-String 'XML Module saved as' | Measure-Object).Count -gt 0
    $warn = ($out | Select-String 'WARNING|ERROR|Exception' | Measure-Object).Count
    '{0} {1,-40} {2} ({3} warnings)' -f $set, $_.Name, $(if ($ok) { 'ok' } else { 'FAILED' }), $warn
    if (-not $ok) { $out | Select-Object -Last 5 }
  }
  # Forms2XML writes <name>_fmb.xml / <name>_mmb.xml next to the source file; keep dev\ clean.
  Get-ChildItem $src -File | Where-Object { $_.Name -match '_(fmb|mmb)\.xml$' } | Move-Item -Destination $dst -Force
}

# The XML contains the hardcoded DB passwords of FD_LOGIN_SIID (SECURITY_FINDINGS SEC-001). Mask them.
$masked = 0
Get-ChildItem (Join-Path $repo 'analysis\forms-xml') -Recurse -Filter *.xml | ForEach-Object {
  $t = Get-Content $_.FullName -Raw -Encoding UTF8
  $m = [regex]::Replace($t, "(v_password\s*:=\s*')[^']*(')", '$1***$2', 'IgnoreCase')
  $m = [regex]::Replace($m, "(LOGON\s*\(\s*'[^']*'\s*,\s*')[^'@]*(@)", '$1***$2', 'IgnoreCase')
  if ($m -ne $t) { Set-Content $_.FullName $m -Encoding utf8NoBOM -NoNewline; $masked++ }
}
"masked password literals in $masked file(s)"
$all = Get-ChildItem (Join-Path $repo 'analysis\forms-xml') -Recurse -File
'{0} XML files, {1:N1} MB' -f $all.Count, (($all | Measure-Object Length -Sum).Sum / 1MB)
