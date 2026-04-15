

## تحلیل مشکل

صفحه سفید که گزارش می‌دهید **از سمت اکستنشن‌های مرورگر شماست** (کیف پول Binance/MetaMask)، نه از سمت کد سایت. اسکرین‌شات از preview نشان می‌دهد سایت کاملاً سالم بارگذاری می‌شود.

## شواهد

- اسکرین‌شات preview: کهکشان کامل با خورشید، سیارات و HUD نمایش داده می‌شود
- خطای گزارش‌شده: `chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk` — اکستنشن Binance Wallet
- هیچ خطای داخلی در کنسول وجود ندارد
- فیلتر خطاهای اکستنشن قبلاً در `App.tsx` اضافه شده

## طرح اقدام

### ۱. افزودن React Error Boundary
یک Error Boundary سراسری به `App.tsx` اضافه شود تا اگر هر خطایی (از جمله تزریق اکستنشن) باعث crash شود، به جای صفحه سفید، پیام خطا نمایش داده شود و دکمه "تلاش مجدد" وجود داشته باشد.

### ۲. حذف selfHealingMonitor از auto-start
فایل `selfHealingMonitor.ts` یک `unhandledrejection` listener ثبت می‌کند که ممکن است با listener اصلی App.tsx تداخل ایجاد کند. باید اطمینان حاصل شود که listener مانیتور قبل از listener فیلتر App اجرا نمی‌شود، یا اینکه خطاهای اکستنشن را فیلتر کند.

### ۳. توصیه فوری به کاربر
- سایت را در **حالت Incognito** باز کنید
- یا اکستنشن‌های کیف پول (Binance Wallet, MetaMask) را غیرفعال کنید
- `Ctrl + Shift + R` برای Hard Refresh

### جزئیات فنی

```text
فایل‌های تغییر:
├── src/App.tsx              → افزودن ErrorBoundary class component
├── src/lib/selfHealingMonitor.ts → فیلتر خطاهای extension
```

**ErrorBoundary** یک class component خواهد بود که `componentDidCatch` را پیاده‌سازی می‌کند و به جای صفحه سفید، یک UI fallback با دکمه reload نمایش می‌دهد.

**Security Finding:** هشدار `hardcoded_passphrase` همچنان باقی است و نیاز به Lovable Cloud برای رفع دارد.

