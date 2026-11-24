(() => {
  const API_URL = "https://fntppqmximwnwfmncdnl.supabase.co/functions/v1/darik-api";
  const BOT_USERNAME = "DarikQuestBot";
  const tg = window.Telegram?.WebApp;
  const $ = (id) => document.getElementById(id);
  const fa = (n) => new Intl.NumberFormat(language === "en" ? "en-US" : "fa-IR").format(Number(n || 0));
  const STORE = "darik_miner_test_v1";
  const state = { points: 0, hashrate: 25.6, miningStart: 0, miningEnd: 0, activeSession: null, claimInFlight: false, nextClaimRetryAt: 0, wallet: null, user: null, tonUI: null, quests: [], questCompletions: [] };
  let noticeTimer, audioContext = null;
  let soundEnabled = localStorage.getItem("darik_sound") !== "off";
  let language = localStorage.getItem("darik_language") === "en" ? "en" : "fa";
  const tr = (faText, enText) => language === "en" ? enText : faText;
  function playUiSound(kind = "tap") {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext ||= new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = "sine";
      if (kind === "success") {
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1174.66, now + 0.085);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.075, now + 0.012);
        gain.gain.setValueAtTime(0.065, now + 0.085);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
        oscillator.start(now); oscillator.stop(now + 0.2);
      } else {
        oscillator.frequency.setValueAtTime(720, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
        oscillator.start(now); oscillator.stop(now + 0.06);
      }
      oscillator.connect(gain); gain.connect(audioContext.destination);
    } catch (_) {}
  }
  function notice(message, type = "info") {
    $("notice").textContent = message; $("notice").classList.add("show");
    if (type === "success") {
      playUiSound("success");
      try { tg?.HapticFeedback?.notificationOccurred("success"); } catch (_) {}
    }
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $("notice").classList.remove("show"), 3800);
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    playUiSound("tap");
    try { tg?.HapticFeedback?.impactOccurred("light"); } catch (_) {}
  }, true);
  function applyLanguage() {
    const en = language === "en";
    document.documentElement.lang = language;
    document.documentElement.dir = en ? "ltr" : "rtl";
    const set = (selector, values, html = false) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        const value = Array.isArray(values) ? values[i] : values;
        if (value !== undefined) html ? el.innerHTML = value : el.textContent = value;
      });
    };
    set(".test-tag", en ? '<i></i> PRIVATE PREVIEW' : '<i></i> نسخه خصوصی', true);
    set(".welcome .eyebrow", en ? "WELCOME TO DARIK" : "خوش آمدی به دنیای داریک");
    set(".welcome h1", en ? 'Mine the <em>future</em>' : 'آینده را <em>استخراج کن</em>', true);
    set(".welcome p", en ? "Stay active, complete missions and grow your mining power." : "هر روز فعال باش، مأموریت انجام بده و قدرت استخراجت را افزایش بده.");
    set(".mine-hero h2", en ? 'Power comes from the <em>community</em>' : 'قدرت از <em>جامعه</em> می‌آید', true);
    set(".mine-hero p", en ? "Manage your private mining session and miner." : "استخراج خصوصی خود را مدیریت کن و ماینرت را ارتقا بده.");
    set(".summary-heading > span", en ? "Network status" : "وضعیت شبکه");
    set(".summary-heading b", en ? '<i></i> PRIVATE NETWORK' : '<i></i> شبکه خصوصی', true);
    set(".summary-metrics small", en ? ["Active miner", "Current power", "Session length"] : ["ماینر فعال", "قدرت فعلی", "دوره استخراج"]);
    set(".summary-chart span", en ? "Performance overview" : "نمای گرافیکی عملکرد");
    set(".summary-chart small", en ? "Live network analytics not connected" : "اطلاعات آماری واقعی هنوز متصل نیست");
    set(".miner-card .live-label", en ? ["Miner status", "Darik withdrawal"] : ["وضعیت ماینر", "برداشت داریک"]);
    set(".miner-card .balance-label", en ? ["Mining points balance", "Minimum real withdrawal"] : ["موجودی امتیاز آزمایشی", "حداقل برداشت واقعی"]);
    set(".balance-line span", en ? ["TEST POINTS", "DRK"] : ["امتیاز آزمایشی", "DRK"]);
    set(".miner-stats small", en ? ["Mining power", "Miner level", "Session length"] : ["قدرت استخراج", "سطح ماینر", "زمان دوره"]);
    set(".progress-meta span", en ? "Mining progress" : "پیشرفت استخراج");
    set(".section-title .eyebrow", en ? "MORE POWER" : "قدرت بیشتر");
    set(".section-title h2", en ? "Upgrade center" : "مرکز ارتقا");
    set(".section-note", en ? "Darik features" : "ویژگی‌های داریک");
    set(".feature-card b", en ? ["Miners", "Boost", "Missions", "Invite friends", "Shop", "Leaderboard", "Profile"] : ["ماینرها", "بوست", "مأموریت‌ها", "دعوت دوستان", "فروشگاه", "رتبه‌بندی", "پروفایل"]);
    set(".feature-card small", en ? ["Choose a level", "Increase hash power", "Earn test points", "Grow the community", "Future upgrades", "User rankings", "Your account"] : ["انتخاب و خرید سطح", "افزایش قدرت هش", "فعالیت و امتیاز", "گسترش جامعه", "ارتقاهای آزمایشی", "جدول کاربران", "حساب کاربری"]);
    set(".bottom-nav small", en ? ["Mine", "Miners", "Tasks", "Friends", "Ranks", "Profile"] : ["ماینر", "ماینرها", "مأموریت", "دعوت", "رتبه‌ها", "پروفایل"]);
    set("#screen-miners .page-heading h2", en ? "Darik miners" : "ماینرهای داریک");
    set("#screen-miners .page-heading p", en ? "View your active miner and prepare for the next level." : "ماینر فعال خودت را ببین و برای سطح بالاتر آماده شو.");
    set("#screen-tasks .page-heading h2", en ? "Missions" : "مأموریت‌ها");
    set("#screen-boost .page-heading h2", en ? "Mining boost" : "بوست قدرت استخراج");
    set("#screen-referrals .page-heading h2", en ? "Invite friends" : "دعوت دوستان");
    set("#screen-shop .page-heading h2", en ? "Darik shop" : "فروشگاه");
    set("#screen-leaderboard .page-heading h2", en ? "Leaderboard" : "رتبه‌بندی");
    set("#screen-profile .page-heading h2", en ? "Profile" : "پروفایل");
    set(".active-miner-top span", en ? "Your active miner" : "ماینر فعال تو");
    set(".active-miner-body small", en ? "Current level" : "سطح فعلی");
    set(".active-miner-body h3", en ? "Base miner · LEVEL 01" : "ماینر پایه · LEVEL 01");
    set(".miner-shop-heading h3", en ? "Choose your next miner" : "انتخاب ماینر بعدی");
    set("#screen-boost .info-card h3", en ? 'Current power: <b id="boostRate">' + Number(state.hashrate).toFixed(1) + ' MH/s</b>' : 'قدرت فعلی: <b id="boostRate">' + Number(state.hashrate).toFixed(1) + ' MH/s</b>', true);
    set("#screen-profile .profile-row span", en ? ["Test points", "Account status"] : ["امتیاز آزمایشی", "وضعیت حساب"]);
    set("#screen-profile .profile-row b:last-child", en ? "PRIVATE PREVIEW" : "نسخه خصوصی");
    set("#mineButton", en ? "Start mining ↗" : "شروع استخراج ↗");
    set("#walletButton", state.wallet ? shortWallet(state.wallet) : (en ? "Connect wallet" : "اتصال کیف پول"));
    $("languageButton").textContent = en ? "FA" : "EN";
    $("soundButton").textContent = soundEnabled ? "🔊" : "🔇";
    $("soundButton").setAttribute("aria-label", soundEnabled ? (en ? "Mute sounds" : "خاموش کردن صدا") : (en ? "Enable sounds" : "روشن کردن صدا"));
    $("soundButton").title = soundEnabled ? (en ? "Sound on" : "صدا روشن") : (en ? "Sound off" : "صدا خاموش");
    updateMining();
  }
  function readStore() {
    try { const saved = JSON.parse(localStorage.getItem(STORE) || "{}"); state.hashrate = saved.hashrate || 25.6; }
    catch (_) {}
  }
  function saveStore() { localStorage.setItem(STORE, JSON.stringify({ hashrate: state.hashrate })); }
  if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor?.("#080807"); tg.setBackgroundColor?.("#080807"); }
  state.user = tg?.initDataUnsafe?.user || null;
  $("profileName").textContent = state.user ? [state.user.first_name, state.user.last_name].filter(Boolean).join(" ") : "کاربر داریک";
  $("username")?.textContent;
  readStore();

  function go(screen) {
    document.querySelectorAll(".screen").forEach(el => el.classList.toggle("active", el.id === "screen-" + screen));
    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("selected", el.dataset.screen === screen));
    if (screen === "miners") renderMinerLevels();
    if (screen === "referrals") makeReferral();
    if (screen === "profile") updateProfile();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll("[data-screen]").forEach(el => el.addEventListener("click", () => go(el.dataset.screen)));
  function shortWallet(address) {
    return address ? address.slice(0, 6) + "…" + address.slice(-6) : tr("اتصال کیف پول", "Connect wallet");
  }
  function updateProfile() {
    renderPoints();
  }
  function makeReferral() {
    const id = state.user?.id;
    const link = id ? "https://t.me/" + BOT_USERNAME + "?startapp=ref_" + id : "لینک دعوت پس از ورود از تلگرام ساخته می‌شود";
    $("refLink").textContent = link;
    $("refCount").textContent = "۰";
  }
  $("copyRef").addEventListener("click", async () => {
    const value = $("refLink").textContent;
    try { await navigator.clipboard.writeText(value); notice(tr("لینک دعوت کپی شد.","Invite link copied."), "success"); }
    catch (_) { notice("کپی خودکار ممکن نیست؛ لینک را انتخاب و کپی کن."); }
  });
  $("shareRef").addEventListener("click", () => {
    const link = $("refLink").textContent;
    const share = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("به داریک ماینر بپیوند!");
    if (tg?.openTelegramLink) tg.openTelegramLink(share); else window.open(share, "_blank");
  });

  function renderPoints() {
    const session = state.activeSession;
    let pending = 0;
    if (session?.started_at) {
      const elapsed = Math.max(0, Math.min(10800, (Date.now() - new Date(session.started_at).getTime()) / 1000));
      pending = Math.floor((elapsed / 60) * (Number(session.hash_rate || 25.6) / 25.6));
    }
    const shown = state.points + pending;
    $("points").textContent = fa(shown);
    $("profilePoints").textContent = fa(shown);
  }
  async function claimMining() {
    if (state.claimInFlight || Date.now() < state.nextClaimRetryAt) return;
    state.claimInFlight = true;
    try {
      const result = await api("claim_mining");
      if (!result?.ok) throw new Error(result?.error || "ثبت پاداش ناموفق بود.");
      state.points += Number(result.points || 0);
      state.activeSession = null;
      state.miningStart = 0; state.miningEnd = 0;
      renderPoints();
      updateMining();
      notice(tr("پاداش آزمایشی استخراج در حساب ثبت شد: ","Test mining reward credited: ") + fa(result.points || 0) + tr(" امتیاز."," points."), "success");
      await bootstrap();
    } catch (e) {
      state.nextClaimRetryAt = Date.now() + 30000;
      notice(e.message || "ثبت پاداش انجام نشد؛ دوباره تلاش می‌کنیم.");
    } finally { state.claimInFlight = false; }
  }
  function updateMining() {
    const now = Date.now(), session = state.activeSession;
    const start = session?.started_at ? new Date(session.started_at).getTime() : 0;
    const end = session?.ends_at ? new Date(session.ends_at).getTime() : 0;
    const active = Boolean(session && end > now);
    const finished = Boolean(session && end && now >= end);
    let progress = 0, remaining = 3 * 60 * 60 * 1000;
    if (active) { remaining = end - now; progress = Math.min(100, ((now - start) / (3 * 60 * 60 * 1000)) * 100); }
    else if (finished) { progress = 100; remaining = 0; }
    const seconds = Math.max(0, Math.floor(remaining / 1000));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), sec = seconds % 60;
    $("timer").textContent = [h,m,sec].map(x => String(x).padStart(2,"0")).join(":");
    $("progressBar").style.width = progress + "%"; $("progressText").textContent = fa(Math.floor(progress)) + "٪";
    $("minerStatus").textContent = active ? tr("در حال استخراج و جمع‌آوری امتیاز","Mining and earning points") : finished ? tr("پایان استخراج؛ ثبت پاداش…","Mining complete; recording reward…") : tr("آماده شروع","Ready to start");
    $("mineButton").classList.toggle("running", active || finished || state.claimInFlight);
    $("mineButton").disabled = active || finished || state.claimInFlight;
    $("mineButton").innerHTML = active ? tr("استخراج در حال انجام است…","Mining in progress…") : finished || state.claimInFlight ? tr("در حال ثبت پاداش…","Recording reward…") : tr("شروع استخراج <span>↗</span>","Start mining <span>↗</span>");
    $("hashrate").innerHTML = Number(session?.hash_rate || state.hashrate).toFixed(1) + " <i>MH/s</i>";
    $("boostRate").textContent = Number(session?.hash_rate || state.hashrate).toFixed(1) + " MH/s";
    renderPoints();
    if (finished) claimMining();
  }
  $("mineButton").addEventListener("click", async () => {
    if (state.activeSession) return;
    $("mineButton").disabled = true;
    try {
      const result = await api("start_mining");
      if (!result?.ok || !result.started_at || !result.ends_at) throw new Error(result?.error || "شروع استخراج ناموفق بود.");
      state.activeSession = { id: result.id, started_at: result.started_at, ends_at: result.ends_at, hash_rate: result.hash_rate || 25.6 };
      state.miningStart = new Date(result.started_at).getTime();
      state.miningEnd = new Date(result.ends_at).getTime();
      notice(result.existing ? tr("استخراج فعال قبلی بازیابی شد.","Previous active mining session restored.") : tr("استخراج ۳ ساعته شروع شد.","3-hour mining session started."), "success");
      updateMining();
    } catch (e) {
      $("mineButton").disabled = false;
      notice(e.message || "شروع استخراج انجام نشد.");
    }
  });
  $("boostButton").addEventListener("click", () => {
    state.hashrate = Math.min(99.9, state.hashrate + 1.6); saveStore(); updateMining(); notice(tr("قدرت نمایشی ماینر افزایش یافت؛ این ارتقا خرید واقعی نیست.","Preview miner power increased; this is not a real purchase."), "success");
  });

  function renderMinerLevels() {
    const levels = [
      { level: 2, name: "ماینر برنزی", tier: "BRONZE MINER", mark: "II" },
      { level: 3, name: "ماینر نقره‌ای", tier: "SILVER MINER", mark: "III" },
      { level: 4, name: "ماینر طلایی", tier: "GOLD MINER", mark: "IV" },
      { level: 5, name: "ماینر پلاتینیوم", tier: "PLATINUM MINER", mark: "V" },
      { level: 6, name: "ماینر کوروش", tier: "CYRUS ELITE", mark: "VI" }
    ];
    const root = $("minerLevels");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    levels.forEach(item => {
      const card = document.createElement("article"); card.className = "miner-level-card";
      const emblem = document.createElement("div"); emblem.className = "miner-level-icon"; emblem.textContent = item.mark;
      const info = document.createElement("div"); info.className = "miner-level-info";
      const kicker = document.createElement("span"); kicker.className = "level-kicker"; kicker.textContent = item.tier;
      const title = document.createElement("h4"); title.textContent = (language === "en" ? ["", "", "Bronze Miner", "Silver Miner", "Gold Miner", "Platinum Miner", "Cyrus Elite"][item.level] : item.name) + " · LEVEL " + String(item.level).padStart(2,"0");
      const desc = document.createElement("p"); desc.textContent = tr("ماینر اختصاصی این سطح با قدرت استخراج بالاتر. قیمت و نرخ هش پس از نهایی‌شدن اقتصاد DRK اعلام می‌شود.","A dedicated miner tier with higher hash power. Price and hash rate will be announced after DRK tokenomics are finalized.");
      const meta = document.createElement("div"); meta.className = "miner-level-meta";
      const power = document.createElement("span"); power.textContent = tr("قدرت هش: ","Hash power: "); const powerB = document.createElement("b"); powerB.textContent = tr("به‌زودی","Coming soon"); power.append(powerB);
      const price = document.createElement("span"); price.textContent = tr("قیمت: ","Price: "); const priceB = document.createElement("b"); priceB.textContent = tr("قیمت تعیین نشده","Not set"); price.append(priceB);
      meta.append(power, price); info.append(kicker,title,desc,meta);
      const buy = document.createElement("button"); buy.className = "miner-level-buy"; buy.disabled = true; buy.textContent = tr("خرید پس از تعیین قیمت و تکمیل پرداخت امن","Purchases unlock after pricing and secure payments are ready");
      card.append(emblem,info,buy); root.append(card);
    });
  }

  function renderQuests(quests, completions = []) {
    state.quests = quests || []; state.questCompletions = completions || [];
    const done = new Set(completions.map(x => x.quest_id || x.questId));
    const icons = ["✈","𝕏","◎","◆","★"];
    $("quests").innerHTML = "";
    if (!quests?.length) { $("quests").innerHTML = '<div class="loading">فعلاً مأموریتی ثبت نشده است.</div>'; return; }
    quests.forEach((q, i) => {
      const id = q.id || q.quest_id, isDone = done.has(id) || q.status === "pending" || q.completed === true;
      const card = document.createElement("article"); card.className = "quest";
      const icon = document.createElement("div"); icon.className = "quest-icon"; icon.textContent = icons[i % icons.length];
      const info = document.createElement("div"); info.className = "quest-info";
      const title = document.createElement("b"); title.textContent = (language === "en" ? (q.title_en || q.title || q.name) : (q.title_fa || q.title || q.name)) || tr("مأموریت داریک","Darik mission");
      const desc = document.createElement("small"); desc.textContent = (language === "en" ? (q.description_en || q.description) : (q.description_fa || q.description)) || tr("برای دریافت امتیاز آزمایشی انجام بده.","Complete this mission to earn test points.");
      info.append(title, desc);
      const reward = document.createElement("span"); reward.className = "reward"; reward.textContent = "+" + fa(q.reward_points || q.points || q.reward || 50);
      const btn = document.createElement("button"); btn.textContent = isDone ? tr("ثبت شده","Submitted") : tr("ارسال","Submit");
      btn.disabled = isDone;
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = tr("در حال ارسال…","Submitting…");
        try { await api("submit_quest", { questId: id }); btn.textContent = tr("در انتظار بررسی","Pending review"); notice(tr("مأموریت برای بررسی ثبت شد.","Mission submitted for review."), "success"); }
        catch (e) { btn.disabled = false; btn.textContent = tr("ارسال","Submit"); notice(e.message); }
      });
      card.append(icon, info, reward, btn); $("quests").append(card);
    });
  }
  async function api(action, extra = {}) {
    const initData = tg?.initData || "";
    if (!initData) throw new Error("برای استفاده از مأموریت‌ها، برنامه را از داخل ربات تلگرام باز کن.");
    const response = await fetch(API_URL, { method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"tma " + initData }, body:JSON.stringify({ action, ...extra }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || "ارتباط با سرور ناموفق بود.");
    return data;
  }
  async function bootstrap() {
    if (!tg?.initData) { $("quests").innerHTML = '<div class="loading">برای دریافت مأموریت‌ها، از داخل ربات @DarikQuestBot وارد شو.</div>'; return; }
    try {
      const data = await api("bootstrap");
      const profile = data.profile || {};
      state.points = Number(data.testPoints ?? profile.test_points ?? profile.points ?? 0);
      state.activeSession = data.activeSession || null;
      state.miningStart = state.activeSession?.started_at ? new Date(state.activeSession.started_at).getTime() : 0;
      state.miningEnd = state.activeSession?.ends_at ? new Date(state.activeSession.ends_at).getTime() : 0;
      renderPoints(); updateMining();
      renderQuests(data.quests || [], data.questCompletions || []);
      if (data.mode === "TEST" || data.realDrkRewardsEnabled === false) notice(tr("امتیازها آزمایشی‌اند؛ پاداش واقعی DRK غیرفعال است.","Points are for private testing; real DRK rewards are disabled."));
    } catch (e) { $("quests").innerHTML = '<div class="loading">دریافت اطلاعات سرور ناموفق بود. اتصال اینترنت را بررسی کن.</div>'; notice(e.message); }
  }

  function updateWalletUI(wallet, restored = false) {
    state.wallet = wallet?.account?.address || null;
    $("walletButton").textContent = shortWallet(state.wallet);
    $("walletButton").title = state.wallet || "اتصال کیف پول";
    $("walletButton").classList.toggle("wallet-connected", Boolean(state.wallet));
    if (state.wallet && !restored) notice(tr("کیف پول با موفقیت متصل شد.","Wallet connected successfully."), "success");
    updateProfile();
  }
  function setupWallet() {
    const manifestUrl = "https://dariktoken-ui.github.io/darik-miner/tonconnect-manifest.json";
    try {
      if (!window.TON_CONNECT_UI?.TonConnectUI) {
        notice("سرویس اتصال کیف پول بارگذاری نشد؛ اتصال اینترنت را بررسی کن.");
        return;
      }
      state.tonUI = new window.TON_CONNECT_UI.TonConnectUI({
        manifestUrl,
        buttonRootId: null,
        restoreConnection: true
      });
      state.tonUI.onStatusChange(wallet => updateWalletUI(wallet));
      state.tonUI.connectionRestored?.then(() => {
        updateWalletUI(state.tonUI.wallet, true);
      }).catch(error => {
        console.warn("TON Connect restore:", error);
        updateWalletUI(null, true);
      });
    } catch (e) {
      console.warn("TON Connect init:", e);
      notice("راه‌اندازی اتصال کیف پول ناموفق بود.");
    }
  }
  async function connectWallet() {
    if (!state.tonUI) { notice("اتصال تون‌کیپر بارگذاری نشد؛ صفحه را دوباره باز کن."); return; }
    try { await state.tonUI.openModal(); } catch (_) { notice("اتصال کیف پول انجام نشد."); }
  }
  $("walletButton").addEventListener("click", connectWallet);
  $("languageButton").addEventListener("click", () => { language = language === "fa" ? "en" : "fa"; localStorage.setItem("darik_language", language); applyLanguage(); });
  $("soundButton").addEventListener("click", () => { soundEnabled = !soundEnabled; localStorage.setItem("darik_sound", soundEnabled ? "on" : "off"); applyLanguage(); if (soundEnabled) playUiSound("success"); });
  setupWallet();
  applyLanguage();
  updateMining(); setInterval(updateMining, 1000);
  bootstrap();
})();