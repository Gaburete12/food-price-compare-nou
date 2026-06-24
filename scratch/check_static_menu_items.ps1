# Inspect data.ts to see the static menu for dabo-doner-constanta
$content = Get-Content "client/src/lib/data.ts" -Raw
$daboIndex = $content.IndexOf('"dabo-doner-constanta"')
if ($daboIndex -lt 0) { $daboIndex = $content.IndexOf("'dabo-doner-constanta'") }

if ($daboIndex -ge 0) {
    # Let's find "menu: [" after dabo-doner-constanta
    $menuIndex = $content.IndexOf("menu: [", $daboIndex)
    if ($menuIndex -ge 0) {
        Write-Output "Found menu: [ at character $menuIndex"
        # Find closing brace of the menu
        # We can just count the number of '{' and '}' to find the end of the array, or we can look for '],' 
        $endIndex = $content.IndexOf("],", $menuIndex)
        if ($endIndex -ge 0) {
            $menuStr = $content.Substring($menuIndex, $endIndex - $menuIndex + 2)
            # Count the occurrences of 'id: ' inside this menu string
            $count = ([regex]::Matches($menuStr, 'id:\s*')).Count
            Write-Output "Number of items in static menu: $count"
            Write-Output "First item snippet in static menu:"
            $snippetEnd = [Math]::Min(500, $menuStr.Length)
            Write-Output $menuStr.Substring(0, $snippetEnd)
        }
    } else {
        Write-Output "Could not find menu: [ for dabo"
    }
} else {
    Write-Output "Could not find dabo"
}
