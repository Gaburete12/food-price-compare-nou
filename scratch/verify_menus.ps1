# Verify restaurant-menus.json content
if (Test-Path "data/restaurant-menus.json") {
    $content = Get-Content "data/restaurant-menus.json" -Raw
    $data = ConvertFrom-Json $content
    Write-Output "File loaded successfully."
    Write-Output "updatedAt: $($data.updatedAt)"
    Write-Output "source: $($data.source)"
    Write-Output "Keys in menus:"
    $data.menus | Get-Member -MemberType NoteProperty | ForEach-Object {
        $name = $_.Name
        $count = $data.menus.$name.Count
        Write-Output " - $name : $count items"
    }
} else {
    Write-Output "data/restaurant-menus.json does not exist!"
}
