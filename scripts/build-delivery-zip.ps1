# Gera o .zip de entrega de Soluções Computacionais a partir do repositório.
# Uso (na raiz do repo):  .\scripts\build-delivery-zip.ps1
# Copia o necessário para uma pasta temporária com os nomes pedidos (api, web, app, docs),
# confere se não vazou nada proibido e compacta. O repositório original não é alterado.
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$stage = Join-Path $env:TEMP 'rollcore-entrega'
$zip = Join-Path $root 'RollCore-entrega.zip'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory $stage | Out-Null

function Copy-Clean($from, $to) {
  # robocopy espelha a pasta sem os diretórios pesados ou gerados
  robocopy $from $to /E /XD node_modules .expo dist web-build target .git .vscode /XF .env .env.local *.log | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy falhou em $from" }
}
Copy-Clean (Join-Path $root 'backend') (Join-Path $stage 'api')
Copy-Clean (Join-Path $root 'web')     (Join-Path $stage 'web')
Copy-Clean (Join-Path $root 'mobile')  (Join-Path $stage 'app')
Copy-Clean (Join-Path $root 'docs')    (Join-Path $stage 'docs')
foreach ($f in 'docker-compose.yml','mvnw','mvnw.cmd') { Copy-Item (Join-Path $root $f) $stage }
Copy-Item (Join-Path $root '.mvn') (Join-Path $stage '.mvn') -Recurse -ErrorAction SilentlyContinue

# Em api/, o wrapper do Maven fica na raiz do pacote: ajuste o docker-compose para o novo nome
(Get-Content (Join-Path $stage 'docker-compose.yml') -Raw) -replace './backend','./api' |
  Set-Content (Join-Path $stage 'docker-compose.yml') -Encoding UTF8
$mis = @()
foreach ($p in 'docs\README.md','api\README.md','web\README.md','app\README.md') {
  if (-not (Test-Path (Join-Path $stage $p))) { $mis += $p }
}
if ($mis) { throw "Faltam arquivos obrigatórios: $($mis -join ', ')" }
$bad = Get-ChildItem $stage -Recurse -Force -Directory -Filter node_modules
$bad += Get-ChildItem $stage -Recurse -Force -File | Where-Object { $_.Name -in '.env','.env.local' }
if ($bad) { throw "Itens proibidos no pacote: $($bad.FullName -join ', ')" }
$link = Select-String -Path (Join-Path $stage 'docs\README.md') -Pattern 'A PREENCHER' -SimpleMatch
if ($link) { Write-Warning "docs/README.md ainda tem campos pendentes (link do vídeo)." }

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip
Write-Host "Gerado: $zip ($([math]::Round((Get-Item $zip).Length/1MB,1)) MB)"
