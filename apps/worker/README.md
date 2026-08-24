# Kisan Setu — Background Worker

Background job processing service for **Kisan Setu**, powered by **BullMQ** and **Redis**.

---

## ⚙️ Background Processors

1. **`price-ingestion`**: Scheduled ingestion of Mandi price records from data.gov.in / Agmarknet, upserting to Postgres and updating Redis caches.
2. **`weather-ingestion`**: Scheduled ingestion of IMD weather observations and 5-day forecasts.
3. **`buyer-matching`**: Asynchronous scan and match calculation upon new farmer sell intent or buyer requirement.
4. **`notifications`**: Asynchronous dispatch of in-app notifications.
5. **`whatsapp`**: Asynchronous outbound WhatsApp message dispatcher via Meta Cloud API.
6. **`cleanup`**: Nightly database cleanup for expired requirements.

---

## 🛠️ Local Development

```bash
# From repository root
npm run dev:worker

# OR from apps/worker directory
cd apps/worker
npm run dev
```

---

## 🐳 Docker Deployment

```bash
docker build -f Dockerfile -t kisan-setu-worker ../..
docker run --env-file .env kisan-setu-worker
```
