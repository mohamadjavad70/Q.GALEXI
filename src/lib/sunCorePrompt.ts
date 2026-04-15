/**
 * SunCore Executive AI — Reasoning Protocol & Prompt System
 * ──────────────────────────────────────────────────────────
 * Protocol: For each topic, AI asks itself 7 internal questions,
 * then outputs 2 questions + 5 logical answers → 1 final answer + 1 question to user.
 */

export const SUNCORE_SYSTEM_PROMPT = `You are SunCore Executive AI for Q-Galaxy.
Your job is to take a single user prompt and implement it into the product as working features.

Core rules:
- The experience must feel like a real-time 3D game (fast feedback). Three.js is the renderer.
- The server/API is the source of truth for planets, users, trust, moderation, and anti-spam.
- Always implement changes end-to-end: UI + API + DB model + validation + basic tests.
- Never add or promote illegal content, onion directories, or instructions for wrongdoing.
- Security focus is defensive: rate limits, verification, moderation, audit logs.

Product pillars:
1) Sun (central command) = Executive AI panel + memory + galaxy builder
2) Galaxy map = 3D interactive, searchable autopilot navigation
3) Planets/stars = gifts + user planets, with trust-based orbit distance
4) Instant feel = optimistic UI updates; then server confirmation

Reasoning Protocol:
For EVERY topic you receive:
1. Internally ask yourself 7 questions to reach a conclusion
2. Review the list of available apps/tools and extract top 3 features from each relevant one
3. Add those features to your reasoning context
4. Generate 2 strategic questions and 5 logical, actionable answers
5. Convert to final output: 1 clear answer + 1 follow-up question to the user

Output format:
📊 تحلیل: [brief analysis]
🎯 پاسخ نهایی: [your executive answer]
❓ سوال بعدی: [your follow-up question to user]
`;

/** App categories for the executive AI to analyze */
export interface AppEntry {
  name: string;
  category: string;
  topFeatures: string[];
}

export const APP_CATEGORIES: Record<string, AppEntry[]> = {
  "AI Assistants": [
    { name: "Claude", category: "AI", topFeatures: ["Deep reasoning", "Long context", "Code generation"] },
    { name: "ChatGPT", category: "AI", topFeatures: ["Plugins ecosystem", "Vision/Image", "Real-time search"] },
    { name: "DeepSeek", category: "AI", topFeatures: ["Open-source models", "Code specialization", "Cost efficiency"] },
    { name: "Gemini", category: "AI", topFeatures: ["Multimodal", "Google integration", "Large context"] },
    { name: "Grok", category: "AI", topFeatures: ["Real-time X data", "Humor mode", "Unfiltered answers"] },
    { name: "Perplexity", category: "AI", topFeatures: ["Source citations", "Real-time search", "Academic focus"] },
    { name: "MS Copilot", category: "AI", topFeatures: ["Office integration", "Enterprise security", "Multi-model"] },
  ],
  "AI Image Generation": [
    { name: "Midjourney", category: "Image", topFeatures: ["Artistic quality", "Style control", "Upscaling"] },
    { name: "DALL-E", category: "Image", topFeatures: ["Text rendering", "Inpainting", "API access"] },
    { name: "FLUX", category: "Image", topFeatures: ["Open-source", "Speed", "Consistency"] },
    { name: "Stable Diffusion", category: "Image", topFeatures: ["Local hosting", "LoRA training", "Community models"] },
    { name: "Adobe Firefly", category: "Image", topFeatures: ["Commercial license", "Adobe integration", "Content credentials"] },
    { name: "Ideogram", category: "Image", topFeatures: ["Text in images", "Poster design", "Free tier"] },
    { name: "Recraft", category: "Image", topFeatures: ["Vector output", "Brand consistency", "Design-focused"] },
  ],
  "AI Video Generation": [
    { name: "Runway", category: "Video", topFeatures: ["Gen-3 Alpha", "Motion brush", "Camera control"] },
    { name: "HeyGen", category: "Video", topFeatures: ["Avatar creation", "Lip sync", "Translation"] },
    { name: "Descript", category: "Video", topFeatures: ["Text-based editing", "Overdub", "Screen recording"] },
    { name: "Kinga", category: "Video", topFeatures: ["Animation", "Character consistency", "Batch processing"] },
    { name: "InVideo", category: "Video", topFeatures: ["Templates", "Auto-subtitles", "Stock library"] },
  ],
  "AI Writing": [
    { name: "Jasper", category: "Writing", topFeatures: ["Brand voice", "Campaign creation", "SEO optimization"] },
    { name: "Copy.ai", category: "Writing", topFeatures: ["Sales copy", "Workflow automation", "Multilingual"] },
    { name: "Grammarly", category: "Writing", topFeatures: ["Grammar correction", "Tone detection", "Plagiarism check"] },
  ],
  "AI Coding": [
    { name: "Cursor", category: "Coding", topFeatures: ["Codebase awareness", "Multi-file editing", "Chat with code"] },
    { name: "GitHub Copilot", category: "Coding", topFeatures: ["Inline completion", "VS Code integration", "Context awareness"] },
    { name: "Replit", category: "Coding", topFeatures: ["Cloud IDE", "Deployment", "Multiplayer coding"] },
    { name: "Tabnine", category: "Coding", topFeatures: ["Privacy-first", "Self-hosted option", "Team learning"] },
  ],
  "Workflow Automation": [
    { name: "Zapier", category: "Automation", topFeatures: ["6000+ integrations", "No-code", "Conditional logic"] },
    { name: "Make", category: "Automation", topFeatures: ["Visual builder", "Complex workflows", "Data transformation"] },
    { name: "N8n", category: "Automation", topFeatures: ["Self-hosted", "Open-source", "Code nodes"] },
    { name: "Monday.com", category: "Automation", topFeatures: ["Project management", "Custom workflows", "Dashboards"] },
  ],
  "AI Scheduling": [
    { name: "Calendly", category: "Scheduling", topFeatures: ["Booking links", "Team scheduling", "Integrations"] },
    { name: "Motion", category: "Scheduling", topFeatures: ["AI auto-scheduling", "Task prioritization", "Calendar optimization"] },
    { name: "Reclaim AI", category: "Scheduling", topFeatures: ["Habit tracking", "Smart breaks", "Team analytics"] },
  ],
  "AI Design": [
    { name: "Canva", category: "Design", topFeatures: ["Templates", "Brand kit", "AI magic tools"] },
    { name: "Figma", category: "Design", topFeatures: ["Collaborative design", "Prototyping", "Dev handoff"] },
    { name: "Uizard", category: "Design", topFeatures: ["Screenshot to design", "AI wireframing", "Theme generation"] },
  ],
  "AI Spreadsheets": [
    { name: "Rows AI", category: "Spreadsheet", topFeatures: ["AI analysis", "Data enrichment", "API connections"] },
    { name: "SheetAI", category: "Spreadsheet", topFeatures: ["GPT in sheets", "Formula generation", "Batch processing"] },
    { name: "Gigasheet", category: "Spreadsheet", topFeatures: ["Big data", "No-code analysis", "Cloud processing"] },
  ],
  "AI Meeting Notes": [
    { name: "Otter", category: "Meeting", topFeatures: ["Live transcription", "Action items", "Speaker identification"] },
    { name: "Fireflies", category: "Meeting", topFeatures: ["CRM integration", "Topic tracking", "Sentiment analysis"] },
    { name: "Fathom", category: "Meeting", topFeatures: ["Free recording", "Highlight clips", "AI summaries"] },
  ],
};

/** Executive reasoning steps (local simulation) */
export interface ReasoningStep {
  question: string;
  answer: string;
}

export interface ExecutiveResponse {
  internalQuestions: ReasoningStep[];
  strategicQuestions: string[];
  actionableAnswers: string[];
  finalAnswer: string;
  followUpQuestion: string;
  relevantApps: AppEntry[];
}

/** Simulate the 7-question reasoning protocol locally */
export function simulateExecutiveReasoning(userPrompt: string): ExecutiveResponse {
  // Find relevant apps based on prompt keywords
  const lowerPrompt = userPrompt.toLowerCase();
  const relevantApps: AppEntry[] = [];
  
  for (const [, apps] of Object.entries(APP_CATEGORIES)) {
    for (const app of apps) {
      const nameMatch = lowerPrompt.includes(app.name.toLowerCase());
      const catMatch = lowerPrompt.includes(app.category.toLowerCase());
      if (nameMatch || catMatch) relevantApps.push(app);
    }
  }
  
  // If no specific match, pick from most relevant categories
  if (relevantApps.length === 0) {
    const categories = Object.values(APP_CATEGORIES);
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    relevantApps.push(...randomCat.slice(0, 3));
  }

  const internalQuestions: ReasoningStep[] = [
    { question: "هدف اصلی کاربر چیست؟", answer: `تحلیل درخواست: "${userPrompt.slice(0, 50)}..."` },
    { question: "چه ابزارهایی مرتبط هستند؟", answer: `${relevantApps.map(a => a.name).join("، ")}` },
    { question: "ویژگی‌های برتر هر ابزار؟", answer: relevantApps.slice(0, 3).map(a => `${a.name}: ${a.topFeatures[0]}`).join(" | ") },
    { question: "ریسک‌های امنیتی؟", answer: "بررسی دسترسی‌ها و اعتبارسنجی ورودی" },
    { question: "تأثیر بر تجربه کاربری؟", answer: "باید سریع و بازی‌گونه باشد" },
    { question: "نیازمندی‌های زیرساختی؟", answer: "Edge Function + DB + RLS" },
    { question: "اولویت اجرا؟", answer: "UI اول، سپس API، سپس تست" },
  ];

  return {
    internalQuestions,
    strategicQuestions: [
      "آیا این قابلیت باید real-time باشد یا batch؟",
      "سطح دسترسی مورد نیاز: عمومی یا فقط فرمانده؟",
    ],
    actionableAnswers: [
      "پیاده‌سازی UI با optimistic update",
      "ساخت Edge Function برای پردازش سمت سرور",
      "اضافه کردن RLS برای امنیت داده",
      "لاگ کردن در Genetic Ledger",
      "تست end-to-end با سناریوهای واقعی",
    ],
    finalAnswer: `بر اساس تحلیل ۷ سوالی، بهترین رویکرد برای "${userPrompt.slice(0, 30)}..." ترکیب ${relevantApps.slice(0, 2).map(a => a.name).join(" و ")} با معماری سه‌لایه (UI → API → DB) است. ابتدا رابط کاربری ساخته شود، سپس منطق سرور اضافه گردد.`,
    followUpQuestion: "آیا می‌خواهید این قابلیت ابتدا به صورت دمو ساخته شود یا مستقیم با backend کامل پیاده شود؟",
    relevantApps: relevantApps.slice(0, 5),
  };
}
