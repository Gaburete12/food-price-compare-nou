# explore_wolt_json.ps1
$json = Get-Content -Path "scratch/wolt_raw_state.json" -Raw | ConvertFrom-Json

# Let's inspect the top-level keys
Write-Host "Top-level keys in JSON:"
$json.PSObject.Properties.Name | ForEach-Object { Write-Host " - $_" }

# Let's search recursively for keys that might contain menus, categories, items, etc.
# Wolt's initial state often has a deeply nested structure like state.venue.menu or state.wolt-store.venue.menu
# Let's do a quick search for keys like "items", "categories" in the parsed object
Write-Host "`nSearching for 'menu' or 'items' properties..."

function Search-Properties($obj, $path = "") {
    if ($null -eq $obj) { return }
    if ($obj -is [string] -or $obj -is [valueType]) { return }
    
    if ($obj -is [array]) {
        if ($obj.Count -gt 0) {
            Search-Properties $obj[0] "$path[]"
        }
        return
    }
    
    foreach ($prop in $obj.PSObject.Properties) {
        $name = $prop.Name
        $newPath = if ($path -eq "") { $name } else { "$path.$name" }
        
        if ($name -like "*menu*" -or $name -eq "items" -or $name -eq "categories") {
            Write-Host "Found: $newPath (Type: $($prop.TypeNameOfValue))"
            if ($name -eq "items" -or $name -eq "categories") {
                # Print sample count
                try {
                    $count = $prop.Value.Count
                    Write-Host "  -> Count: $count"
                } catch {}
            }
        }
        
        # Recurse if it's a nested object
        if ($prop.Value -is [PSCustomObject] -or $prop.Value -is [array]) {
            # Avoid too deep recursion
            if ($newPath.Split('.').Length -le 8) {
                Search-Properties $prop.Value $newPath
            }
        }
    }
}

Search-Properties $json
