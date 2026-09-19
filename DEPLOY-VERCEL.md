# Vercel-ზე გაშვება

პროექტი ახლა სრულად თვითკმარია: ვიდეო, ფოტოები და ფონტები რეპოზიტორიაშია
(`src/assets/`, `public/fonts/`), Lovable-ის ჰოსტინგზე აღარაფერია დამოკიდებული.
მუსიკა YouTube-იდან იტვირთება (გარე ბმული, ყველგან მუშაობს).

## ნაბიჯები

1. Vercel → New Project → აირჩიე ეს GitHub რეპო.
2. Framework Preset: **Other** (Vite). Build Command: `npm run build`.
   Output-ს Nitro თვითონ აწყობს Vercel preset-ით (`.vercel/output`).
3. Environment Variables (Production + Preview):

   | სახელი                          | მნიშვნელობა         |
   | ------------------------------- | ------------------- |
   | `VITE_SUPABASE_URL`             | იგივე რაც `.env`-ში |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | იგივე რაც `.env`-ში |
   | `VITE_SUPABASE_PROJECT_ID`      | იგივე რაც `.env`-ში |

   ადმინ პანელს დამატებითი server secret აღარ სჭირდება. `ADMIN_ACCESS_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` და `NITRO_PRESET` არ არის საჭირო.

4. Deploy. `vercel.json` ავტომატურად ირჩევს Vercel-ის server preset-ს.
   ადმინი: `https://<შენი-დომენი>/admin`, კოდი: `iosebi-mariami`.
