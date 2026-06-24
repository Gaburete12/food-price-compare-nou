# explore_wolt_queries.ps1
$json = Get-Content -Path "scratch/wolt_raw_state.json" -Raw | ConvertFrom-Json

# Let's inspect $json.queries which is usually an array of queries
Write-Host "Number of queries: $($json.queries.Count)"

$idx = 0
foreach ($q in $json.queries) {
    $queryKey = $q.queryKey
    $queryKeyStr = $queryKey | ConvertTo-Json -Compress
    Write-Host "Query $idx key: $queryKeyStr"
    
    # Check if there is data inside state.data
    if ($null -ne $q.state -and $null -ne $q.state.data) {
        $keys = $q.state.data.PSObject.Properties.Name
        Write-Host "  -> State data keys: $($keys -join ', ')"
    }
    Write-Host ""
    $idx++
}
