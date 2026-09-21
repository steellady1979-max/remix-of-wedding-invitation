# Google Apps Script-ის გამართვა

1. Google Sheet-ში გახსენით **Extensions → Apps Script**.
2. `Code.gs`-ში წაშალეთ საწყისი `myFunction` და ჩასვით `google-apps-script/Code.gs`-ის სრული კოდი.
3. მარცხნივ გახსენით **Project Settings → Script Properties** და დაამატეთ:
   - Property: `API_SECRET`
   - Value: გრძელი შემთხვევითი მნიშვნელობა, მინიმუმ 32 სიმბოლო.
4. დააჭირეთ **Deploy → New deployment → Web app**.
5. აირჩიეთ:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. დაადასტურეთ Google-ის ავტორიზაცია და დააკოპირეთ `/exec`-ით დასრულებული Web App URL.
7. Vercel → Project → Settings → Environment Variables-ში დაამატეთ:
   - `GOOGLE_APPS_SCRIPT_URL` — დაკოპირებული `/exec` URL
   - `API_SECRET` — ზუსტად იგივე მნიშვნელობა, რაც Apps Script-ის `API_SECRET`

კოდი თავსებადობისთვის `GOOGLE_APPS_SCRIPT_SECRET` სახელსაც იღებს.
8. გაუშვით ახალი deployment.

`LOVABLE_API_KEY` და `GOOGLE_SHEETS_API_KEY` ამის შემდეგ აღარ გამოიყენება და Vercel-იდან შეგიძლიათ წაშალოთ.
