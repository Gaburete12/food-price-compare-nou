$items = @(
    @{ name = "Carlsberg"; category = "BEERS" },
    @{ name = "Ursus"; category = "BEERS" },
    @{ name = "Tuborg"; category = "BEERS" },
    @{ name = "Schweppes Kinley"; category = "Beer" },
    @{ name = "Still Water"; category = "Beer" },
    @{ name = "Sparkling Water"; category = "Beer" },
    @{ name = "BERE TUBORG ALC 5.0% vol"; category = "Buturi alcoolice" },
    @{ name = "BERE URSUS ALC 5 % vol"; category = "Buturi alcoolice" }
)

function Clean-RestaurantCategory($restaurantId, $name, $originalCategory) {
    $n = $name.ToLower()
    $c = ($originalCategory -split "") -join "" # to handle possible nulls or convert to string safely
    $c = $c.ToLower()

    # 1. Pizza & Paste
    if (
        $n.Contains("pizza") -or
        $n.Contains("paste") -or
        $n.Contains("spaghetti") -or
        $n.Contains("lasagna") -or
        $n.Contains("penne") -or
        $c.Contains("pizza") -or
        $c.Contains("paste")
    ) {
        return "Pizza și Paste"
    }

    # 2. Meniuri și Buckets
    $hasMenuKeywords = $n.Contains("meniu") -or $n.Contains("bucket") -or $n.Contains("box") -or $n.Contains("combo") -or $n.Contains("family") -or $n.Contains("smart") -or $c.Contains("meniu") -or $c.Contains("bucket") -or $c.Contains("cele mai") -or $c.Contains("popular")
    $hasExcludedKeywords = $n.Contains("sos") -or $n.Contains("sauce") -or $n.Contains("dip") -or $n.Contains("jucărie") -or $n.Contains("jucarie") -or $n.Contains("pahar") -or $n.Contains("carte") -or $n.Contains("cărți") -or $n.Contains("carti")
    if ($hasMenuKeywords -and -not $hasExcludedKeywords) {
        return "Meniuri și Buckets"
    }

    # 3. Promoții & Noutăți
    if (
        $n.Contains("promo") -or $n.Contains("noutat") -or $n.Contains("ediție limitat") -or $n.Contains("limitata") -or $n.Contains("ediție specială") -or $n.Contains("speciala") -or $n.Contains("oferta") -or $n.Contains("ofertă") -or $n.Contains("jucărie") -or $n.Contains("jucarie") -or $n.Contains("carte") -or $n.Contains("cărți") -or $n.Contains("carti") -or $c.Contains("promo") -or $c.Contains("noutat")
    ) {
        return "Promoții și Noutăți"
    }

    # 4. Băuturi
    if (
        ($n.Contains("cola") -and -not $n.Contains("rucola")) -or
        $n.Contains("sprite") -or
        $n.Contains("fanta") -or
        $n.Contains("lipton") -or
        $n.Contains("fuzetea") -or
        $n.Contains("suc") -or
        $n.Contains("băutură") -or
        $n.Contains("bautura") -or
        $n.Contains("nectar") -or
        $n.Contains("shake") -or
        $n.Contains("apa") -or
        $n.Contains("apă") -or
        $n.Contains("water") -or
        $n.Contains("schweppes") -or
        $n.Contains("kinley") -or
        $n.Contains("bere") -or
        $n.Contains("beer") -or
        $n.Contains("carlsberg") -or
        $n.Contains("ursus") -or
        $n.Contains("tuborg") -or
        $n.Contains("heineken") -or
        $n.Contains("somersby") -or
        $n.Contains("limonada") -or
        $n.Contains("limonadă") -or
        $n.Contains("fresh") -or
        $c.Contains("băutur") -or
        $c.Contains("bautur") -or
        $c.Contains("bauturi") -or
        $c.Contains("băuturi") -or
        $c.Contains("butur") -or
        $c.Contains("beer") -or
        $c.Contains("bere") -or
        $c.Contains("suc")
    ) {
        return "Băuturi"
    }

    # Fallback absolut
    $restLower = $restaurantId.ToLower()
    if ($restLower.Contains("pizza")) {
        return "Pizza și Paste"
    }

    return "Promoții și Noutăți"
}

Write-Host "Testing with the new proposed rules:" -ForegroundColor Cyan
foreach ($item in $items) {
    $res = Clean-RestaurantCategory "pizzahut-constanta" $item.name $item.category
    $color = "Green"
    if ($res -ne "Băuturi") { $color = "Red" }
    Write-Host "Name: `"$($item.name)`" | Original Cat: `"$($item.category)`" => Result: `"$res`"" -ForegroundColor $color
}
