# Gera o .zip de entrega de Soluções Computacionais a partir do repositório.
# Uso (na raiz do repo):  .\scripts\build-delivery-zip.ps1
# Copia o necessário para uma pasta temporária com os nomes pedidos (api, web, app, docs),
# dentro de uma pasta raiz (nome do projeto), como no modelo do PDF de instruções.
# Confere se não vazou nada proibido e compacta. O repositório original não é alterado.
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$work = Join-Path $env:TEMP 'rollcore-entrega'
$project = 'RollCore'                      # pasta raiz dentro do .zip
$stage = Join-Path $work $project
$zip = Join-Path $root 'RollCore-entrega.zip'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
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
foreach ($p in 'docs\README.md','docs\DADOS.pdf','api\README.md','web\README.md','app\README.md') {
  if (-not (Test-Path (Join-Path $stage $p))) { $mis += $p }
}
if ($mis) { throw "Faltam arquivos obrigatórios: $($mis -join ', ')" }
$bad = Get-ChildItem $stage -Recurse -Force -Directory -Filter node_modules
$bad += Get-ChildItem $stage -Recurse -Force -File | Where-Object { $_.Name -in '.env','.env.local' }
if ($bad) { throw "Itens proibidos no pacote: $($bad.FullName -join ', ')" }
if (-not ((Test-Path (Join-Path $stage 'docs\BMC.pdf')) -or (Test-Path (Join-Path $stage 'docs\BMC.md')))) {
  throw "Falta o BMC em docs (BMC.pdf ou BMC.md)."
}
$prints = @(Get-ChildItem (Join-Path $stage 'docs\prints') -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -in '.png','.jpg','.jpeg' })
if ($prints.Count -lt 3) { Write-Warning "docs/prints tem $($prints.Count) imagem(ns); a entrega pede 3." }
$link = Select-String -Path (Join-Path $stage 'docs\README.md') -Pattern 'A PREENCHER' -SimpleMatch
if ($link) { Write-Warning "docs/README.md ainda tem campos pendentes (link do vídeo)." }

# Compacta a pasta raiz inteira (não o conteúdo), para o .zip abrir como RollCore/{docs,api,web,app}
Compress-Archive -Path $stage -DestinationPath $zip
Write-Host "Gerado: $zip ($([math]::Round((Get-Item $zip).Length/1MB,1)) MB)"
