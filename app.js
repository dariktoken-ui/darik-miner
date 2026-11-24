(() => {
  const API_URL = "https://fntppqmximwnwfmncdnl.supabase.co/functions/v1/darik-api";
  const tg = window.Telegram?.WebApp;
  const $ = (id) => document.getElementById(id);
  const fa = (n) => new Intl.NumberFormat("fa-IR").format(Number(n || 0));
  const notice = (message) => { $("notice").textContent = message; $("notice").classList.add("show"); };
  const initData = tg?.initData || "";
  if (tg) { tg.ready(); tg.expand(); }
  const user = tg?.initDataUnsafe?.user;
  $("username").textContent = user ? (user.first_name || user.username || "کاربر تلگرام") : "حالت پیش‌نمایش";
  $("connection").textContent = initData ? "متصل به تلگرام" : "برای استفاده، از داخل تلگرام باز کنید";

  async function api(action, extra = {}) {
    if (!initData) throw new Error("این برنامه باید از داخل ربات تلگرام باز شود.");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "tma " + initData },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || "ارتباط با سرور ناموفق بود.");
    return data;
  }
  function renderQuests(quests, completions = []) {
    const done = new Set(completions.map(x => x.quest_id || x.questId));
    const icons = ["✈","𝕏","◎","◆","★"];
    $("quests").innerHTML = "";
    if (!quests?.length) { $("quests").innerHTML = '<div class="loading">فعلاً مأموریتی ثبت نشده است.</div>'; return; }
    quests.forEach((q, i) => {
      const id = q.id || q.quest_id;
      const isDone = done.has(id) || q.status === "pending" || q.completed === true;
      const card = document.createElement("article"); card.className = "quest";
      const icon = document.createElement("div"); icon.className = "quest-icon"; icon.textContent = icons[i % icons.length];
      const info = document.createElement("div"); info.className = "quest-info";
      const title = document.createElement("b"); title.textContent = q.title_fa || q.title || q.name || "مأموریت داریک";
      const desc = document.createElement("small"); desc.textContent = q.description_fa || q.description || "برای دریافت امتیاز آزمایشی انجام دهید.";
      info.append(title, desc);
      const reward = document.createElement("span"); reward.className = "reward"; reward.textContent = "+" + fa(q.reward_points || q.points || q.reward || 50);
      const btn = document.createElement("button"); btn.textContent = isDone ? "ثبت شده" : "ارسال برای بررسی"; btn.disabled = isDone;
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "در حال ارسال…";
        try { await api("submit_quest", { questId: id }); btn.textContent = "در انتظار بررسی"; notice("مأموریت ارسال شد و پس از بررسی تأیید می‌شود."); }
        catch (e) { btn.disabled = false; btn.textContent = "ارسال برای بررسی"; notice(e.message); }
      });
      card.append(icon, info, reward, btn); $("quests").append(card);
    });
  }
  async function start() {
    try {
      const data = await api("bootstrap");
      const profile = data.profile || {};
      $("points").textContent = fa(data.testPoints ?? profile.test_points ?? profile.points ?? 0);
      renderQuests(data.quests || [], data.questCompletions || []);
      if (data.mode === "TEST" || data.realDrkRewardsEnabled === false) notice("حالت آزمایشی فعال است؛ هیچ DRK واقعی توزیع نمی‌شود.");
    } catch (e) {
      $("quests").innerHTML = '<div class="loading">برای دریافت اطلاعات، برنامه را از دکمه منوی ربات @DarikQuestBot باز کنید.</div>';
      if (initData) notice(e.message);
    }
  }
  start();
})();