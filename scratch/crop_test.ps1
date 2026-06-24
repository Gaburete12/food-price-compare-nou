try {
    Add-Type -AssemblyName System.Drawing
    
    $imgPath = "C:\Users\andre\.antigravity\Meniu Burger King Constanta\1.png"
    $bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
    
    # Define crop coordinates for the three product images
    # Let's crop X=279 to 395 (width 116) and vertical center.
    # Product Y centers are approximately Y=114, 305, 496. Let's crop squares centered at these Ys.
    
    $rects = @(
        @{ name="sir_bacon_beef_tortilla"; x=279; y=110; w=110; h=110 },
        @{ name="sir_bacon_chicken";       x=279; y=301; w=110; h=110 },
        @{ name="sir_bacon_double";        x=279; y=492; w=110; h=110 }
    )
    
    $outDir = "C:\Users\andre\.gemini\antigravity\scratch\food-price-compare12-main\scratch"
    
    foreach ($r in $rects) {
        $cropRect = [System.Drawing.Rectangle]::new($r.x, $r.y, $r.w, $r.h)
        $cropped = $bmp.Clone($cropRect, $bmp.PixelFormat)
        
        $outFile = Join-Path $outDir "$($r.name).png"
        $cropped.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
        Write-Output "Saved cropped image to $outFile"
    }
    
    $bmp.Dispose()
    Write-Output "Done cropping test!"
} catch {
    Write-Error "Error: $_"
}
