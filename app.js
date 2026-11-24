(() => {
  const API_URL = "https://fntppqmximwnwfmncdnl.supabase.co/functions/v1/darik-api";
  const BOT_USERNAME = "DarikQuestBot";
  const tg = window.Telegram?.WebApp;
  const $ = (id) => document.getElementById(id);
  const fa = (n) => new Intl.NumberFormat("fa-IR").format(Number(n || 0));
  const state = { points: 0, hashrate: 25.6, miningStart: 0, miningEnd: 0, miningSessionId: null, wallet: null, user: null, tonUI: null, quests: [] };
  let noticeTimer;
  function notice(message) {
    $("notice").textContent = message; $("notice").classList.add("show");
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $("notice").classList.remove("show"), 3800);
  }
  if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor?.("#080807"); tg.setBackgroundColor?.("#080807"); }
  state.user = tg?.initDataUnsafe?.user || null;
  $("profileName").textContent = state.user ? [state.user.first_name, state.user.last_name].filter(Boolean).join(" ") : "کاربر داریک";
  $("username")?.textContent;

  function go(screen) {
    document.querySelectorAll(".screen").forEach(el => el.classList.toggle("active", el.id === "screen-" + screen));
    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("selected", el.dataset.screen === screen));
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
    const elapsed = state.miningStart ? Math.max(0, Math.min(3 * 60 * 60 * 1000, now - state.miningStart)) : 0;
    const pending = state.miningSessionId ? Math.floor((elapsed / 60000) * (state.hashrate / 25.6)) : 0;
    let progress = 0, remaining = 3 * 60 * 60 * 1000;
    if (active) { remaining = state.miningEnd - now; progress = Math.min(100, (elapsed / (3 * 60 * 60 * 1000)) * 100); }
    else if (state.miningSessionId && state.miningEnd && now >= state.miningEnd) { progress = 100; }
    const seconds = Math.max(0, Math.floor(remaining / 1000));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    $("timer").textContent = [h,m,s].map(x => String(x).padStart(2,"0")).join(":");
    $("progressBar").style.width = progress + "%"; $("progressText").textContent = fa(Math.floor(progress)) + "٪";
    $("minerStatus").textContent = active ? "در حال استخراج" : progress === 100 ? "آماده دریافت امتیاز" : "آماده شروع";
    $("mineButton").classList.toggle("running", active);
    $("mineButton").disabled = active;
    $("mineButton").innerHTML = active ? "استخراج در حال انجام <span>Ⅱ</span>" : progress === 100 ? "دریافت امتیاز آزمایشی <span>↗</span>" : "شروع استخراج <span>↗</span>";
    $("points").textContent = fa(state.points + pending);
    $("hashrate").innerHTML = state.hashrate.toFixed(1) + " <i>MH/s</i>";
    $("boostRate").textContent = state.hashrate.toFixed(1) + " MH/s";
  }
  $("mineButton").addEventListener("click", async () => {
    const button = $("mineButton");
    button.disabled = true;
    try {
      if (state.miningSessionId && Date.now() >= state.miningEnd) {
        const result = await api("claim_mining");
        if (!result.ok) throw new Error("دوره استخراج برای دریافت امتیاز آماده نیست.");
        notice("امتیاز آزمایشی در حساب ثبت شد.");
        state.miningSessionId = null; state.miningStart = 0; state.miningEnd = 0;
        await bootstrap();
      } else if (!state.miningSessionId) {
        const result = await api("start_mining");
        if (!result?.ok || !result.id) throw new Error("شروع استخراج از سرور تأیید نشد.");
        state.miningSessionId = result.id;
        state.miningStart = Date.parse(result.started_at);
        state.miningEnd = Date.parse(result.ends_at);
        state.hashrate = Number(result.hash_rate || 25.6);
        notice("استخراج سه‌ساعته روی سرور شروع شد.");
      }
    } catch (e) { notice(e.message || "عملیات استخراج ناموفق بود."); }
    finally { button.disabled = false; updateMining(); }
  });
  $("boostButton").addEventListener("click", () => {
    notice("افزایش قدرت فقط پس از خرید واقعی DRK و تأیید موجودی کیف پول فعال می‌شود.");
  });

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
      const session = data.activeSession;
      state.miningSessionId = session?.id || null;
      state.miningStart = session ? Date.parse(session.started_at) : 0;
      state.miningEnd = session ? Date.parse(session.ends_at) : 0;
      state.hashrate = Number(session?.hash_rate || 25.6);
      updateMining();
      if (data.mode === "TEST" || data.realDrkRewardsEnabled === false) notice("حالت آزمایشی فعال است؛ امتیازها آزمایشی‌اند و پاداش واقعی DRK غیرفعال است.");
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