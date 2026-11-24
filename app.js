(() => {
  if (window.__DARIK_MINER_APP_INITIALIZED__) return;
  window.__DARIK_MINER_APP_INITIALIZED__ = true;
  const API_URL = "https://fntppqmximwnwfmncdnl.supabase.co/functions/v1/darik-api";
  const BOT_USERNAME = "DarikQuestBot";
  const tg = window.Telegram?.WebApp;
  const $ = (id) => document.getElementById(id);
  const fa = (n) => new Intl.NumberFormat(language === "en" ? "en-US" : "fa-IR").format(Number(n || 0));
    const state = { drkBalance: 0, hashrate: 25.6, minerLevel: 1, miningStart: 0, activeSession: null, wallet: null, user: null, tonUI: null, quests: [], questCompletions: [] };
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
  // Original, locally synthesized Darik ambient theme. Starts only after a user gesture.
  let musicTimer = null, musicMaster = null, musicNodes = [];
  let musicStep = 0;
  function stopBackgroundMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (musicMaster && audioContext) {
      try { musicMaster.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.25); } catch (_) {}
    }
    musicNodes.forEach(node => { try { node.stop?.(audioContext.currentTime + 0.8); } catch (_) {} });
    musicNodes = [];
    musicMaster = null;
  }
  function startBackgroundMusic() {
    if (!soundEnabled || musicTimer) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext ||= new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      const now = audioContext.currentTime;
      musicMaster = audioContext.createGain();
      musicMaster.gain.setValueAtTime(0.0001, now);
      musicMaster.gain.setTargetAtTime(0.038, now + 0.15, 1.8);
      musicMaster.connect(audioContext.destination);
      const pad = audioContext.createOscillator();
      const padGain = audioContext.createGain();
      pad.type = "sine"; pad.frequency.value = 73.42;
      padGain.gain.value = 0.20;
      pad.connect(padGain); padGain.connect(musicMaster); pad.start();
      musicNodes.push(pad);
      const notes = [293.66, 349.23, 392.00, 440.00, 392.00, 349.23, 261.63, 293.66, 349.23, 440.00, 523.25, 440.00, 392.00, 349.23, 293.66, 261.63];
      const playNote = () => {
        if (!soundEnabled || !musicMaster || !audioContext) return;
        const t = audioContext.currentTime + 0.04;
        const osc = audioContext.createOscillator();
        const overtone = audioContext.createOscillator();
        const env = audioContext.createGain();
        const tone = notes[musicStep % notes.length];
        musicStep++;
        osc.type = "sine"; osc.frequency.setValueAtTime(tone, t);
        overtone.type = "sine"; overtone.frequency.setValueAtTime(tone * 2.01, t);
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.22, t + 0.35);
        env.gain.setTargetAtTime(0.0001, t + 1.25, 0.55);
        osc.connect(env); overtone.connect(env); env.connect(musicMaster);
        osc.start(t); overtone.start(t); osc.stop(t + 4.2); overtone.stop(t + 4.2);
      };
      playNote();
      musicTimer = setInterval(playNote, 2400);
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
    set(".miner-card .balance-label", en ? ["Darik balance", "Minimum withdrawal threshold"] : ["موجودی داریک", "حداقل برداشت"]);
    set(".balance-line span", "DRK");
    set(".miner-stats small", en ? ["Mining power", "Miner level", "Mining time"] : ["قدرت استخراج", "سطح ماینر", "مدت استخراج"]);
    set(".progress-meta span", en ? "Mining progress" : "پیشرفت استخراج");
    set(".section-title .eyebrow", en ? "MORE POWER" : "قدرت بیشتر");
    set(".section-title h2", en ? "Upgrade center" : "مرکز ارتقا");
    set(".section-note", en ? "Darik features" : "ویژگی‌های داریک");
    set(".feature-card b", en ? ["Miners", "Boost", "Missions", "Invite friends", "Shop", "Leaderboard", "Profile"] : ["ماینرها", "بوست", "مأموریت‌ها", "دعوت دوستان", "فروشگاه", "رتبه‌بندی", "پروفایل"]);
    set(".feature-card small", en ? ["Choose a level", "Increase hash power", "Complete missions", "Grow the community", "Future upgrades", "User rankings", "Your account"] : ["انتخاب سطح ماینر", "افزایش قدرت هش", "انجام مأموریت‌ها", "گسترش جامعه", "ارتقاهای آینده", "جدول کاربران", "حساب کاربری"]);
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
    set("#screen-profile .profile-row span", en ? ["Darik balance", "Account status"] : ["موجودی داریک", "وضعیت حساب"]);
    set("#screen-profile .profile-row b:last-child", en ? "PRIVATE PREVIEW" : "نسخه خصوصی");
    set("#mineButton", en ? "Start mining ↗" : "شروع استخراج ↗");
    set("#walletButton", state.wallet ? shortWallet(state.wallet) : (en ? "Connect wallet" : "اتصال کیف پول"));
    $("languageButton").textContent = en ? "FA" : "EN";
    $("soundButton").textContent = soundEnabled ? "🔊" : "🔇";
    $("soundButton").setAttribute("aria-label", soundEnabled ? (en ? "Mute sounds" : "خاموش کردن صدا") : (en ? "Enable sounds" : "روشن کردن صدا"));
    $("soundButton").title = soundEnabled ? (en ? "Sound on" : "صدا روشن") : (en ? "Sound off" : "صدا خاموش");
    updateMining();
  }
  if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor?.("#080807"); tg.setBackgroundColor?.("#080807"); }
  state.user = tg?.initDataUnsafe?.user || null;
  $("profileName").textContent = state.user ? [state.user.first_name, state.user.last_name].filter(Boolean).join(" ") : "کاربر داریک";
  $("username")?.textContent;

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
  let referralOffset = 0, referralTotal = 0, referralBusy = false;
  async function makeReferral(reset = true) {
    const id = state.user?.id;
    const link = id ? "https://t.me/" + BOT_USERNAME + "?startapp=ref_" + id : "لینک دعوت پس از ورود از تلگرام ساخته می‌شود";
    $("refLink").textContent = link;
    if (!tg?.initData) {
      $("referralList").textContent = tr("برای مشاهده زیرمجموعه‌ها، برنامه را از داخل تلگرام باز کن.", "Open the Mini App inside Telegram to view your downline.");
      return;
    }
    if (referralBusy) return;
    referralBusy = true;
    const list = $("referralList");
    const meta = $("referralMeta");
    const more = $("loadMoreReferrals");
    if (reset) {
      referralOffset = 0;
      list.innerHTML = '<div class="loading">' + tr("در حال دریافت فهرست زیرمجموعه‌ها…", "Loading your downline…") + '</div>';
    }
    try {
      const data = await api("referral_network", { limit: 50, offset: referralOffset });
      const items = Array.isArray(data.items) ? data.items : [];
      if (reset) list.innerHTML = "";
      items.forEach(item => {
        const row = document.createElement("div");
        row.className = "referral-user-row";
        const identity = document.createElement("span");
        identity.textContent = "ID · " + fa(item.telegram_user_id);
        const depth = document.createElement("small");
        depth.textContent = tr("سطح زیرمجموعه ", "Downline level ") + fa(item.depth);
        row.append(identity, depth);
        list.append(row);
      });
      referralTotal = Number(data.total || 0);
      referralOffset += items.length;
      $("refCount").textContent = fa(referralTotal);
      meta.textContent = tr("نمایش ", "Showing ") + fa(Math.min(referralOffset, referralTotal)) + tr(" از ", " of ") + fa(referralTotal);
      if (!referralTotal) {
        list.innerHTML = '<div class="loading">' + tr("هنوز زیرمجموعه‌ای ثبت نشده است.", "No invited members have registered yet.") + '</div>';
      }
      more.hidden = referralOffset >= referralTotal;
    } catch (error) {
      if (reset) list.innerHTML = "";
      const message = document.createElement("div");
      message.className = "loading";
      message.textContent = tr("دریافت فهرست زیرمجموعه‌ها ناموفق بود؛ دوباره تلاش کن.", "Could not load your downline. Please try again.");
      list.append(message);
      more.hidden = true;
      console.warn("Referral network:", error);
    } finally {
      referralBusy = false;
    }
  }
  $("copyRef").addEventListener("click", async () => {
    const value = $("refLink").textContent;
    try { await navigator.clipboard.writeText(value); notice(tr("لینک دعوت کپی شد.","Invite link copied."), "success"); }
    catch (_) { notice("کپی خودکار ممکن نیست؛ لینک را انتخاب و کپی کن."); }
  });
  $("loadMoreReferrals").addEventListener("click", () => makeReferral(false));
  $("shareRef").addEventListener("click", () => {
    const link = $("refLink").textContent;
    const share = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("به داریک ماینر بپیوند!");
    if (tg?.openTelegramLink) tg.openTelegramLink(share); else window.open(share, "_blank");
  });

  function formatDrk(value) {
    return new Intl.NumberFormat(language === "en" ? "en-US" : "fa-IR", { minimumFractionDigits: 8, maximumFractionDigits: 8 }).format(Math.max(0, Number(value) || 0));
  }
  function renderPoints() {
    const session = state.activeSession;
    let pending = 0;
    if (session?.last_accrued_at) {
      const elapsed = Math.max(0, (Date.now() - new Date(session.last_accrued_at).getTime()) / 1000);
      pending = (elapsed / 86400) * (Number(session.hash_rate || 25.6) / 25.6);
    }
    const shown = state.drkBalance + pending;
    $("points").textContent = formatDrk(shown);
    $("profilePoints").textContent = formatDrk(shown);
  }
  function updatePresence(presence, locallyHidden = false) {
    const dot = $("presenceDot");
    if (!dot) return;
    const online = !locallyHidden && Boolean(presence?.is_online);
    dot.classList.toggle("is-online", online);
    dot.classList.toggle("is-offline", !online);
    const label = dot.parentElement;
    if (label) label.lastChild.textContent = online
      ? tr(" آنلاین · ماینر فعال", " Online · Miner active")
      : tr(" برای سبز شدن، ۵ دقیقه فعال بمان", " Stay active for 5 minutes to turn green");
  }

  let lastPresencePing = 0;
  async function pingPresence(force = false) {
    if (!tg?.initData) return;
    if (document.visibilityState !== "visible") {
      updatePresence(null, true);
      return;
    }
    if (!force && Date.now() - lastPresencePing < 15000) return;
    lastPresencePing = Date.now();
    try {
      const result = await api("presence_ping");
      if (result?.ok) updatePresence(result.presence);
    } catch (error) {
      console.warn("Presence heartbeat:", error);
      updatePresence(null, true);
    }
  }

  function updateMining() {
    const now = Date.now(), session = state.activeSession;
    const start = session?.started_at ? new Date(session.started_at).getTime() : 0;
    const active = Boolean(session && start && start <= now);
    const elapsed = active ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
    const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), sec = elapsed % 60;
    $("timer").textContent = [h,m,sec].map(x => String(x).padStart(2,"0")).join(":");
    $("progressBar").style.width = active ? "100%" : "0%";
    $("progressText").textContent = active ? tr("پیوسته","LIVE") : "۰٪";
    $("minerStatus").textContent = active ? tr("در حال استخراج DRK","Mining DRK") : tr("آماده شروع","Ready to start");
    $("mineButton").classList.toggle("running", active);
    $("mineButton").disabled = active;
    $("mineButton").innerHTML = active ? tr("استخراج فعال است…","Mining is active…") : tr("شروع استخراج <span>↗</span>","Start mining <span>↗</span>");
    $("hashrate").innerHTML = Number(session?.hash_rate || state.hashrate).toFixed(1) + " <i>MH/s</i>";
    $("boostRate").textContent = Number(session?.hash_rate || state.hashrate).toFixed(1) + " MH/s";
    renderPoints();
  }
  $("mineButton").addEventListener("click", async () => {
    if (state.activeSession) return;
    $("mineButton").disabled = true;
    try {
      const result = await api("start_mining");
      if (!result?.ok || !result.started_at) throw new Error(result?.error || "شروع استخراج ناموفق بود.");
      state.activeSession = { id: result.id, started_at: result.started_at, last_accrued_at: result.last_accrued_at || result.started_at, hash_rate: result.hash_rate || 25.6 };
      state.miningStart = new Date(result.started_at).getTime();
      state.hashrate = Number(result.hash_rate || 25.6);
      notice(result.existing ? tr("استخراج فعال قبلی بازیابی شد.","Previous mining restored.") : tr("استخراج پیوسته داریک شروع شد.","Continuous Darik mining started."), "success");
      updateMining();
    } catch (e) {
      $("mineButton").disabled = false;
      notice(e.message || "شروع استخراج انجام نشد.");
    }
  });
  $("boostButton").addEventListener("click", () => { notice(tr("ارتقای هش پس از تعیین قیمت و راه‌اندازی پرداخت امن فعال می‌شود.","Hash upgrades will unlock after pricing and secure payments are ready.")); });

  function renderMinerLevels() {
    const root = $("minerLevels");
    if (!root) return;
    const level = Math.min(1000, Math.max(1, Number(state.minerLevel || 1)));
    root.innerHTML = "";
    const card = document.createElement("article"); card.className = "miner-level-card";
    const emblem = document.createElement("div"); emblem.className = "miner-level-icon"; emblem.textContent = String(level).padStart(3, "0");
    const info = document.createElement("div"); info.className = "miner-level-info";
    const kicker = document.createElement("span"); kicker.className = "level-kicker"; kicker.textContent = tr("مسیر پیشرفت داریک · ۱۰۰۰ سطح", "DARIK PROGRESSION · 1000 LEVELS");
    const title = document.createElement("h4"); title.textContent = tr("ماینر سطح ", "Miner Level ") + fa(level) + " / " + fa(1000);
    const desc = document.createElement("p"); desc.textContent = tr("سطح فعلی حساب تو. ظرفیت شارژ، قدرت استخراج و مزایای هر سطح طبق قوانین نهایی سرور فعال می‌شوند.", "Your current account level. Charge capacity, mining power and level perks will be controlled by the finalized server rules.");
    const track = document.createElement("div"); track.className = "miner-level-meta";
    const progress = document.createElement("span"); progress.textContent = tr("پیشرفت سطح", "Level progress");
    const value = document.createElement("b"); value.textContent = fa(level) + " / " + fa(1000);
    track.append(progress, value);
    info.append(kicker, title, desc, track);
    card.append(emblem, info); root.append(card);
    const milestones = document.createElement("div"); milestones.className = "miner-level-meta";
    milestones.style.marginTop = "12px";
    milestones.textContent = tr("مراحل پیشرفت: ۱ تا ۱۰۰۰ · جزئیات ارتقا پس از نهایی‌شدن قوانین اقتصادی فعال می‌شود.", "Progression range: 1–1000 · Upgrade details unlock after the economy rules are finalized.");
    root.append(milestones);
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
      const desc = document.createElement("small"); desc.textContent = (language === "en" ? (q.description_en || q.description) : (q.description_fa || q.description)) || tr("برای تکمیل مأموریت انجام بده.","Complete this mission.");
      info.append(title, desc);
      const reward = document.createElement("span"); reward.className = "reward"; reward.textContent = tr("بررسی پاداش","Reward review");
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
      state.drkBalance = Number(profile.drk_balance || 0);
      state.minerLevel = Number(profile.miner_level || 1);
      renderMinerLevels();
      state.activeSession = data.activeSession || null;
      state.hashrate = Number(state.activeSession?.hash_rate || 25.6);
      state.miningStart = state.activeSession?.started_at ? new Date(state.activeSession.started_at).getTime() : 0;
      renderPoints(); updateMining();
      renderQuests(data.quests || [], data.questCompletions || []);
      if (data.realDrkRewardsEnabled === false) notice(tr("موجودی DRK داخل برنامه محاسبه می‌شود؛ برداشت روی بلاکچین هنوز فعال نیست.","DRK accrues in-app; on-chain withdrawals are not enabled yet."));
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
  $("soundButton").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("darik_sound", soundEnabled ? "on" : "off");
    if (soundEnabled) { startBackgroundMusic(); playUiSound("success"); }
    else stopBackgroundMusic();
    applyLanguage();
  });
  document.addEventListener("pointerdown", () => { if (soundEnabled) startBackgroundMusic(); }, { once: true });
  setupWallet();
  applyLanguage();
  updateMining();
  let lastMiningSync = 0;
  setInterval(() => {
    updateMining();
    if (tg?.initData && Date.now() - lastMiningSync >= 30000) {
      lastMiningSync = Date.now();
      api("sync_mining").then(data => {
        if (!data?.ok) return;
        state.drkBalance = Number(data.balance || 0);
        state.activeSession = data.activeSession || null;
        renderPoints(); updateMining();
      }).catch(error => console.warn("Mining sync:", error));
    }
  }, 1000);
  bootstrap();
  pingPresence(true);
  setInterval(() => pingPresence(), 45000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") pingPresence(true);
    else updatePresence(null, true);
  });
  window.addEventListener("focus", () => pingPresence(true));
  window.addEventListener("blur", () => updatePresence(null, true));
})();