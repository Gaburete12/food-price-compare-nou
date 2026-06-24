$dataPath = Join-Path $PSScriptRoot "..\data\restaurant-menus.json"
if (-not (Test-Path $dataPath)) {
    Write-Host "Data file does not exist at $dataPath"
    Exit
}

$content = Get-Content $dataPath -Raw
$data = ConvertFrom-Json $content

foreach ($menuName in $data.menus | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) {
    $items = $data.menus.$menuName
    $pizzas = $items | Where-Object { $_.name -like "*Pizza*" -or $_.name -like "*pizza*" }
    Write-Host "Restaurant: $menuName | Total items: $($items.Count) | Pizzas: $($pizzas.Count)"
    if ($pizzas.Count -gt 0) {
        Write-Host "  Some pizzas:"
        for ($i = 0; $i -lt [Math]::Min(5, $pizzas.Count); $i++) {
            $p = $pizzas[$i]
            Write-Host "    - $($p.name) (Category: $($p.category))"
        }
    }
}
