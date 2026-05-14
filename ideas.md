# Design Brainstorm — FoodRadar

## Idei de Design

<response>
<idea>
**Design Movement:** Neo-Brutalism cu accente de culori vii
**Core Principles:**
- Contrast puternic: negru/alb cu accente de galben/portocaliu
- Tipografie groasă, îndrăzneață, cu personalitate
- Carduri cu borduri vizibile și umbre dure (box-shadow offset)
- Elemente grafice geometrice simple

**Color Philosophy:**
- Background: Alb cald (#FAFAF8)
- Accent primar: Galben aprins (#FFD600) — energie, mâncare, optimism
- Text: Negru profund (#0D0D0D)
- Carduri platforme: Glovo (portocaliu), Bolt (verde), Wolt (albastru)

**Layout Paradigm:** Asimetric — bara de căutare pe stânga, ilustrație pe dreapta pe hero. Carduri de comparație în grid 3 coloane cu borduri groase.

**Signature Elements:**
- Borduri groase (3-4px) pe carduri și butoane
- Umbre offset (shadow: 4px 4px 0px #000)
- Badge-uri cu "CEL MAI IEFTIN" în galben aprins

**Interaction Philosophy:** Click-uri cu feedback vizual imediat (scale + shadow collapse). Hover-uri cu schimbare de culoare rapidă, fără tranziții lente.

**Animation:** Entrance animations rapide (150ms), carduri care "sar" la hover (translateY -4px), buton care se "apasă" la click (translateY +2px, shadow collapse).

**Typography System:**
- Display: Space Grotesk Bold (titluri mari)
- Body: Inter Regular (text curent)
- Accent: Space Grotesk Medium (prețuri, badge-uri)
</idea>
<probability>0.07</probability>
</response>

<response>
<idea>
**Design Movement:** Modern Minimal cu accent pe date și claritate
**Core Principles:**
- Spațiu alb generos, ierarhie vizuală clară
- Culori de brand ale platformelor (Glovo portocaliu, Bolt verde, Wolt albastru)
- Focus pe datele numerice — prețurile sunt protagoniștii
- Mobile-first, fiecare element are un scop clar

**Color Philosophy:**
- Background: Gri foarte deschis (#F5F5F0) — cald, nu rece
- Primary: Portocaliu-roșu (#E8400C) — energie, apetit, urgență
- Surface: Alb pur pentru carduri
- Text: Slate închis (#1E293B)

**Layout Paradigm:** Hero centrat cu search bar proeminentă, urmat de grid de carduri. Bara de căutare este elementul dominant pe pagină — totul gravitează în jurul ei.

**Signature Elements:**
- Badge animat "BEST PRICE" cu gradient
- Progress bar vizual între cele 3 platforme (cine e cel mai ieftin)
- Iconuri custom pentru fiecare platformă

**Interaction Philosophy:** Smooth, fluid, cu tranziții de 200-300ms. Rezultatele apar cu o animație de fade+slide. Butonul "Comandă" pulsează ușor pentru cel mai ieftin.

**Animation:** Staggered entrance pentru carduri (delay de 100ms între ele), shimmer loading skeleton, hover lift cu shadow.

**Typography System:**
- Display: Sora ExtraBold (titluri hero)
- Body: Sora Regular
- Numere/Prețuri: Sora Bold cu dimensiune mai mare
</idea>
<probability>0.09</probability>
</response>

<response>
<idea>
**Design Movement:** Dark Mode Premium cu gradient-uri subtile
**Core Principles:**
- Dark background cu carduri glassmorphism
- Culori neon pentru evidențierea prețului câștigător
- Sentiment de aplicație tech modernă, premium
- Contrast ridicat pentru lizibilitate

**Color Philosophy:**
- Background: #0F0F14 (negru-albăstrui)
- Card surface: rgba(255,255,255,0.05) cu blur
- Accent: Cyan/Teal (#00D4FF) pentru highlight
- Text: Alb și gri deschis

**Layout Paradigm:** Full-screen hero cu particule animate în background, search bar cu glow effect, carduri cu glassmorphism.

**Signature Elements:**
- Glow effect pe cardul câștigător
- Gradient text pentru titlul principal
- Particule/dots animate în background

**Interaction Philosophy:** Hover-uri cu glow, tranziții fluide de 300ms, micro-animații pe toate elementele interactive.

**Animation:** Particle background animat, carduri cu entrance staggered, glow pulsating pe best price.

**Typography System:**
- Display: Outfit ExtraBold
- Body: Outfit Regular
- Prețuri: Outfit Bold cu glow text-shadow
</idea>
<probability>0.08</probability>
</response>

## Decizie Finală

**Alegem Opțiunea 2: Modern Minimal cu accent pe date și claritate**

Motivație: Este cea mai potrivită pentru un MVP de food delivery — clară, rapidă de înțeles, funcționează excelent pe mobil, și pune datele (prețurile) în centrul atenției. Culorile calde și tipografia Sora creează o atmosferă prietenoasă și apetisantă.
