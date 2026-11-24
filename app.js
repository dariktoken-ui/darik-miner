(() => {
  const API_URL = "https://fntppqmximwnwfmncdnl.supabase.co/functions/v1/darik-api";
  const BOT_USERNAME = "DarikQuestBot";
  const tg = window.Telegram?.WebApp;
  const $ = (id) => document.getElementById(id);
  const fa = (n) => new Intl.NumberFormat("fa-IR").format(Number(n || 0));
  const STORE = "darik_miner_test_v1";
  const state = { points: 0, hashrate: 25.6, miningStart: 0, miningEnd: 0, wallet: null, user: null, tonUI: null, quests: [] };
  let noticeTimer;
  function notice(message) {
    $("notice").textContent = message; $("notice").classList.add("show");
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $("notice").classList.remove("show"), 3800);
  }
  function readStore() {
    try { const saved = JSON.parse(localStorage.getItem(STORE) || "{}"); state.miningStart = saved.miningStart || 0; state.miningEnd = saved.miningEnd || 0; state.hashrate = saved.hashrate || 25.6; }
    catch (_) {}
  }
  function saveStore() { localStorage.setItem(STORE, JSON.stringify({ miningStart: state.miningStart, miningEnd: state.miningEnd, hashrate: state.hashrate })); }
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
    return address ? address.slice(0, 6) + "…" + address.slice(-6) : "اتصال کیف پول";
  }
  function updateProfile() {
    $("profilePoints").textContent = fa(state.points);
  }
  function makeReferral() {
    const id = state.user?.id;
    const link = id ? "https://t.me/" + BOT_USERNAME + "?startapp=ref_" + id : "لینک دعوت پس از ورود از تلگرام ساخته می‌شود";
    $("refLink").textContent = link;
    $("refCount").textContent = "۰";
  }
  $("copyRef").addEventListener("click", async () => {
    const value = $("refLink").textContent;
    try { await navigator.clipboard.writeText(value); notice("لینک دعوت کپی شد."); }
    catch (_) { notice("کپی خودکار ممکن نیست؛ لینک را انتخاب و کپی کن."); }
  });
  $("shareRef").addEventListener("click", () => {
    const link = $("refLink").textContent;
    const share = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("به داریک ماینر بپیوند!");
    if (tg?.openTelegramLink) tg.openTelegramLink(share); else window.open(share, "_blank");
  });

  function updateMining() {
    const now = Date.now(), active = state.miningEnd > now;
    let progress = 0, remaining = 3 * 60 * 60 * 1000;
    if (active) { remaining = state.miningEnd - now; progress = Math.min(100, ((now - state.miningStart) / (3 * 60 * 60 * 1000)) * 100); }
    else if (state.miningEnd && now >= state.miningEnd) { progress = 100; }
    const seconds = Math.max(0, Math.floor(remaining / 1000));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    $("timer").textContent = [h,m,s].map(x => String(x).padStart(2,"0")).join(":");
    $("progressBar").style.width = progress + "%"; $("progressText").textContent = fa(Math.floor(progress)) + "٪";
    $("minerStatus").textContent = active ? "در حال استخراج" : progress === 100 ? "دوره آزمایشی تمام شد" : "آماده شروع";
    $("mineButton").classList.toggle("running", active);
    $("mineButton").innerHTML = active ? "توقف دوره آزمایشی <span>Ⅱ</span>" : progress === 100 ? "شروع دوره جدید <span>↗</span>" : "شروع استخراج <span>↗</span>";
    $("hashrate").innerHTML = state.hashrate.toFixed(1) + " <i>MH/s</i>";
    $("boostRate").textContent = state.hashrate.toFixed(1) + " MH/s";
  }
  $("mineButton").addEventListener("click", () => {
    if (state.miningEnd > Date.now()) { state.miningStart = 0; state.miningEnd = 0; saveStore(); notice("دوره آزمایشی متوقف شد."); }
    else { state.miningStart = Date.now(); state.miningEnd = state.miningStart + 3 * 60 * 60 * 1000; saveStore(); notice("دوره ۳ ساعته آزمایشی شروع شد."); }
    updateMining();
  });
  $("boostButton").addEventListener("click", () => {
    state.hashrate = Math.min(99.9, state.hashrate + 1.6); saveStore(); updateMining(); notice("قدرت نمایشی ماینر افزایش یافت؛ این ارتقا خرید واقعی نیست.");
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
      const title = document.createElement("h4"); title.textContent = item.name + " · LEVEL " + String(item.level).padStart(2,"0");
      const desc = document.createElement("p"); desc.textContent = "قدرت استخراج بالاتر از سطح قبلی؛ مشخصات و قیمت پس از نهایی‌شدن اقتصاد ماینر اعلام می‌شود.";
      const meta = document.createElement("div"); meta.className = "miner-level-meta";
      const power = document.createElement("span"); power.textContent = "قدرت هش: "; const powerB = document.createElement("b"); powerB.textContent = "به‌زودی"; power.append(powerB);
      const price = document.createElement("span"); price.textContent = "قیمت: "; const priceB = document.createElement("b"); priceB.textContent = "DRK · به‌زودی"; price.append(priceB);
      meta.append(power, price); info.append(kicker,title,desc,meta);
      const buy = document.createElement("button"); buy.className = "miner-level-buy"; buy.disabled = true; buy.textContent = "خرید این سطح پس از فعال‌سازی پرداخت";
      card.append(emblem,info,buy); root.append(card);
    });
  }

  function renderQuests(quests, completions = []) {
    const done = new Set(completions.map(x => x.quest_id || x.questId));
    const icons = ["✈","𝕏","◎","◆","★"];
    $("quests").innerHTML = "";
    if (!quests?.length) { $("quests").innerHTML = '<div class="loading">فعلاً مأموریتی ثبت نشده است.</div>'; return; }
    quests.forEach((q, i) => {
      const id = q.id || q.quest_id, isDone = done.has(id) || q.status === "pending" || q.completed === true;
      const card = document.createElement("article"); card.className = "quest";
      const icon = document.createElement("div"); icon.className = "quest-icon"; icon.textContent = icons[i % icons.length];
      const info = document.createElement("div"); info.className = "quest-info";
      const title = document.createElement("b"); title.textContent = q.title_fa || q.title || q.name || "مأموریت داریک";
      const desc = document.createElement("small"); desc.textContent = q.description_fa || q.description || "برای دریافت امتیاز آزمایشی انجام بده.";
      info.append(title, desc);
      const reward = document.createElement("span"); reward.className = "reward"; reward.textContent = "+" + fa(q.reward_points || q.points || q.reward || 50);
      const btn = document.createElement("button"); btn.textContent = isDone ? "ثبت شده" : "ارسال";
      btn.disabled = isDone;
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "در حال ارسال…";
        try { await api("submit_quest", { questId: id }); btn.textContent = "در انتظار بررسی"; notice("مأموریت برای بررسی ثبت شد."); }
        catch (e) { btn.disabled = false; btn.textContent = "ارسال"; notice(e.message); }
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
      $("points").textContent = fa(state.points); $("profilePoints").textContent = fa(state.points);
      renderQuests(data.quests || [], data.questCompletions || []);
      if (data.mode === "TEST" || data.realDrkRewardsEnabled === false) notice("حالت آزمایشی فعال است؛ پاداش واقعی DRK غیرفعال است.");
    } catch (e) { $("quests").innerHTML = '<div class="loading">دریافت اطلاعات سرور ناموفق بود. اتصال اینترنت را بررسی کن.</div>'; notice(e.message); }
  }

  function updateWalletUI(wallet, restored = false) {
    state.wallet = wallet?.account?.address || null;
    $("walletButton").textContent = shortWallet(state.wallet);
    $("walletButton").title = state.wallet || "اتصال کیف پول";
    $("walletButton").classList.toggle("wallet-connected", Boolean(state.wallet));
    if (state.wallet && !restored) notice("کیف پول با موفقیت متصل شد.");
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
  setupWallet();
  updateMining(); setInterval(updateMining, 1000);
  bootstrap();
})();