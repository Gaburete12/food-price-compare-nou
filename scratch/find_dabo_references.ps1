Get-ChildItem -Path "server", "client", "shared" -Recurse -Include *.ts, *.tsx, *.json | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -like "*dabo*") {
        Write-Host "Found in: $($_.FullName)"
    }
}
