# parse_wolt.ps1
$contentPath = 'C:\Users\andre\.gemini\antigravity\brain\c8afe6ee-37d6-4e6c-abee-f45e1e88b96c\.system_generated\steps\3419\content.md'
$content = Get-Content -Path $contentPath -Raw

# Let's search for JSON data in script tags
# Typically, Wolt has preloaded state or similar JSON blocks.
# Let's search for all script blocks that look like JSON.
$regex = [regex]'<script[^>]*>(.*?)</script>'
$matches = $regex.Matches($content)

Write-Host "Found $($matches.Count) script tags."

$index = 0
foreach ($match in $matches) {
    $scriptContent = $match.Groups[1].Value
    if ($scriptContent -like '*"name":"Meniu DAbo de pui"*') {
        Write-Host "Match found in script index $index! Content length: $($scriptContent.Length)"
        
        # Let's try to parse it as JSON
        try {
            $json = ConvertFrom-Json $scriptContent
            Write-Host "Successfully parsed script index $index as JSON!"
            # Save it to a file for easy reading
            $scriptContent | Out-File -FilePath "scratch/wolt_raw_state.json" -Encoding utf8
            break
        } catch {
            Write-Host "Failed to parse script index $index as JSON: $_"
            # Maybe it is JS code like window.state = {...}? Let's extract the JSON part.
            $jsonStart = $scriptContent.IndexOf('{')
            $jsonEnd = $scriptContent.LastIndexOf('}')
            if ($jsonStart -ge 0 -and $jsonEnd -gt $jsonStart) {
                $jsonText = $scriptContent.Substring($jsonStart, $jsonEnd - $jsonStart + 1)
                try {
                    $json = ConvertFrom-Json $jsonText
                    Write-Host "Successfully parsed extracted JSON from script index $index!"
                    $jsonText | Out-File -FilePath "scratch/wolt_raw_state.json" -Encoding utf8
                    break
                } catch {
                    Write-Host "Failed to parse extracted JSON: $_"
                }
            }
        }
    }
    $index++
}
