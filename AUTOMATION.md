# Delivery Fee Automation

Acest proiect poate actualiza taxele de livrare dintr-o sursa JSON externa, fara sa mai editezi manual `client/src/lib/data.ts`.

## Cum functioneaza

- catalogul de restaurante ramane in `client/src/lib/data.ts`
- override-urile pentru taxe stau in `data/delivery-fees.json`
- serverul expune `GET /api/restaurants` si aplica override-urile peste catalogul static
- scriptul `npm run sync:delivery-fees` poate trage un JSON extern si il salveaza local
- endpoint-ul `POST /api/admin/delivery-fees/sync` poate declansa acelasi sync din Railway

## Variabile de mediu

- `DELIVERY_FEES_SOURCE_URL` - URL-ul JSON-ului cu taxele actualizate
- `DELIVERY_FEES_SYNC_TOKEN` - token simplu pentru endpoint-ul de sync

## Formatul JSON-ului sursa

```json
{
  "updatedAt": "2026-04-24T09:00:00.000Z",
  "source": "google-sheet-export",
  "fees": {
    "kfc-buc-1": {
      "glovo": {
        "deliveryFee": 8.99,
        "serviceFee": 2.99,
        "deliveryTime": 27
      },
      "bolt": {
        "deliveryFee": 6.49,
        "serviceFee": 2.29
      }
    },
    "mcdonalds-buc-1": {
      "glovo": {
        "deliveryFee": 0,
        "serviceFee": 0.99,
        "smallOrderThreshold": 45,
        "dynamicSmallOrderFee": true
      }
    }
  }
}
```

## Variante bune pentru sursa externa

- GitHub Raw JSON
- Google Sheet publicat ca JSON printr-un mic script
- Supabase edge function sau storage bucket

## Railway

Flux simplu:

1. web service-ul ruleaza aplicatia
2. setezi `DELIVERY_FEES_SOURCE_URL`
3. setezi `DELIVERY_FEES_SYNC_TOKEN`
4. cron job-ul face `POST /api/admin/delivery-fees/sync`

Sau, alternativ, cron job-ul ruleaza direct:

```bash
npm run sync:delivery-fees
```

Pentru persistenta reala intre deploy-uri, sursa de adevar trebuie sa fie externa. Fisierul local `data/delivery-fees.json` e bun pentru dezvoltare si fallback, dar nu ar trebui sa fie singura sursa in productie.
