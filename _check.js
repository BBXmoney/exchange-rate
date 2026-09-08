
  const SUPABASE_URL = 'https://rgyihmjdowaeoofqwpcp.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_yKxRRNmq80FQirLEv2oJhw_w6lly-gX';
  const PUBLIC_CSV  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQs6JEWMlGmxBenrtg7NaHuNiegAFmOhDft1Yy5tQp15NmgsAyVtW9D9X8SU31bw4rqtn4WYmokjha8/pub?gid=0&single=true&output=csv';
  const VIP_CSV     = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQs6JEWMlGmxBenrtg7NaHuNiegAFmOhDft1Yy5tQp15NmgsAyVtW9D9X8SU31bw4rqtn4WYmokjha8/pub?gid=247377202&single=true&output=csv';
  const PREV_RATES_KEY = 'bbx_prev_rates';

  const CURRENCY_INFO = {
    USD: { name:'ดอลลาร์สหรัฐ',        flag:'🇺🇸' },
    GBP: { name:'ปอนด์สเตอร์ลิง',       flag:'🇬🇧' },
    EUR: { name:'ยูโร',                  flag:'🇪🇺' },
    CNY: { name:'หยวน จีน',             flag:'🇨🇳' },
    TWD: { name:'ดอลลาร์ไต้หวัน',       flag:'🇹🇼' },
    JPY: { name:'เยน ญี่ปุ่น',           flag:'🇯🇵' },
    SGD: { name:'ดอลลาร์สิงคโปร์',      flag:'🇸🇬' },
    HKD: { name:'ดอลลาร์ฮ่องกง',        flag:'🇭🇰' },
    KRW: { name:'วอน เกาหลีใต้',        flag:'🇰🇷' },
    MYR: { name:'ริงกิต มาเลเซีย',       flag:'🇲🇾' },
    VND: { name:'ดอง เวียดนาม',          flag:'🇻🇳' },
    INR: { name:'รูปี อินเดีย',           flag:'🇮🇳' },
    AUD: { name:'ดอลลาร์ออสเตรเลีย',    flag:'🇦🇺' },
    CHF: { name:'ฟรังก์ สวิส',           flag:'🇨🇭' },
    NZD: { name:'ดอลลาร์นิวซีแลนด์',    flag:'🇳🇿' },
    CAD: { name:'ดอลลาร์แคนาดา',        flag:'🇨🇦' },
    DKK: { name:'โครน เดนมาร์ก',        flag:'🇩🇰' },
    NOK: { name:'โครน นอร์เวย์',         flag:'🇳🇴' },
    SEK: { name:'โครนา สวีเดน',          flag:'🇸🇪' },
    RUB: { name:'รูเบิล รัสเซีย',         flag:'🇷🇺' },
    OMR: { name:'เรียล โอมาน',           flag:'🇴🇲' },
    AED: { name:'ดีแรห์ม UAE',           flag:'🇦🇪' },
    QAR: { name:'เรียล กาตาร์',          flag:'🇶🇦' },
    SAR: { name:'ริยัล ซาอุดีอาระเบีย',  flag:'🇸🇦' },
    BHD: { name:'ดีนาร์ บาห์เรน',        flag:'🇧🇭' },
    BND: { name:'ดอลลาร์บรูไน',          flag:'🇧🇳' },
    KWD: { name:'ดีนาร์ คูเวต',          flag:'🇰🇼' },
    IDR: { name:'รูเปีย อินโดนีเซีย',    flag:'🇮🇩' },
    ZAR: { name:'แรนด์ แอฟริกาใต้',      flag:'🇿🇦' },
    PHP: { name:'เปโซ ฟิลิปปินส์',       flag:'🇵🇭' },
    MMK: { name:'จัต พม่า',              flag:'🇲🇲' },
    MOP: { name:'ปาตากา มาเก๊า',         flag:'🇲🇴' },
    LAK: { name:'กีบ ลาว',               flag:'🇱🇦' },
  };

  window.currentRates = [];

  function getDecimals(currency, value) {
    const five = ['JPY','KRW','VND','IDR','MMK','LAK'];
    const four = ['MOP','PHP','TWD','HKD'];
    if (five.includes(currency)) return 5;
    if (four.includes(currency)) return 4;
    if (value < 0.1) return 5;
    if (value < 1)   return 4;
    return 2;
  }

  function parseCSVRow(row) {
    const cols = [];
    let cur = '', inQ = false;
    for (let c of row) {
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cols.push(cur.trim());
    return cols;
  }

  function getTrend(cur, prev) {
    if (prev === undefined || prev === null || isNaN(prev)) return { symbol: '', cls: '' };
    if (cur > prev) return { symbol: '▲', cls: 'trend-up' };
    if (cur < prev) return { symbol: '▼', cls: 'trend-down' };
    return { symbol: '—', cls: 'trend-same' };
  }

  function populateConverterOptions() {
    const sel = document.getElementById('convCurrency');
    const prevVal = sel.value;
    if (!window.currentRates.length) {
      sel.innerHTML = '<option value="">ไม่มีข้อมูล</option>';
      return;
    }
    sel.innerHTML = window.currentRates
      .map(r => `<option value="${r.currency}">${r.currency} - ${r.name}</option>`)
      .join('');
    if (prevVal && window.currentRates.some(r => r.currency === prevVal)) sel.value = prevVal;
    calcConvert();
  }

  function calcConvert() {
    const amount = parseFloat(document.getElementById('convAmount').value);
    const cur = document.getElementById('convCurrency').value;
    const type = document.getElementById('convType').value;
    const resEl = document.getElementById('convResult');
    const rateObj = window.currentRates.find(r => r.currency === cur);
    if (!rateObj || isNaN(amount) || amount <= 0) {
      resEl.textContent = 'กรอกจำนวนเงินเพื่อคำนวณ';
      return;
    }
    const rate = type === 'buy' ? rateObj.buy : rateObj.sell;
    const total = amount * rate;
    resEl.textContent = `${amount.toLocaleString()} ${cur} = ${total.toLocaleString(undefined,{maximumFractionDigits:2})} บาท (อัตรา ${rate})`;
  }

  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  async function loadRates(isVip) {
    const now = new Date();
    const thai = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Bangkok'}));
    const hour = thai.getHours();
    if (hour < 8 || hour >= 22) {
      document.getElementById('rateTable').innerHTML =
        '<tr><td colspan="5" style="padding:20px;color:#888;text-align:center">⏰ ร้านปิดแล้ว<br>เปิดทำการ 08:00 - 22:00 น.</td></tr>';
      document.getElementById('updated').textContent = 'นอกเวลาทำการ';
      document.getElementById('loginBox').style.display = 'none';
      return;
    }
    const url = isVip ? VIP_CSV : PUBLIC_CSV;
    try {
      const res = await fetch(url);
      const text = await res.text();
      const rows = text.trim().split('\n').slice(1);
      const tbody = document.getElementById('rateTable');
      tbody.innerHTML = '';
      let lastUpdate = '';

      let prevRates = {};
      try { prevRates = JSON.parse(localStorage.getItem(PREV_RATES_KEY)) || {}; } catch(e) { prevRates = {}; }
      const newRates = {};
      window.currentRates = [];

      rows.forEach(row => {
        const cols = parseCSVRow(row);
        if (cols.length < 13) return;
        const currency = cols[0]?.trim();
        const buy  = parseFloat(cols[12]);
        const sell = parseFloat(cols[13]);
        if (!currency || isNaN(buy) || isNaN(sell)) return;
        if (!lastUpdate) lastUpdate = cols[2] || '';
        const info = CURRENCY_INFO[currency] || { name: currency, flag: '🏳️' };
        // Column O (index 14) can hold an override display label,
        // e.g. "USD (50-100)" / "USD (5-20)" for split denomination rows.
        const displayLabel = cols[14]?.trim();
        const displayName  = displayLabel || info.name;
        const dec  = getDecimals(currency, buy);

        newRates[currency] = { buy, sell };
        window.currentRates.push({ currency, name: displayName, buy, sell });

        const prev = prevRates[currency];
        const trendBuy  = getTrend(buy,  prev?.buy);
        const trendSell = getTrend(sell, prev?.sell);

        tbody.innerHTML += `
          <tr>
            <td class="flag">${info.flag}</td>
            <td><strong>${currency}</strong></td>
            <td>${displayName}</td>
            <td class="buy">${buy.toFixed(dec)}<span class="trend ${trendBuy.cls}">${trendBuy.symbol}</span></td>
            <td class="sell">${sell.toFixed(dec)}<span class="trend ${trendSell.cls}">${trendSell.symbol}</span></td>
          </tr>`;
      });

      try { localStorage.setItem(PREV_RATES_KEY, JSON.stringify(newRates)); } catch(e) {}

      document.getElementById('updated').textContent =
        `${isVip ? '⭐ เรทพิเศษ VIP' : 'เรทปกติ'} | อัปเดตล่าสุด: ${lastUpdate}`;

      populateConverterOptions();
    } catch(e) {
      document.getElementById('rateTable').innerHTML =
        '<tr><td colspan="5">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</td></tr>';
    }
  }

  async function login() {
    const email = document.getElementById('email').value;
    const pass  = document.getElementById('password').value;
    document.getElementById('errorMsg').textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) document.getElementById('errorMsg').textContent = 'Email หรือ Password ไม่ถูกต้อง';
  }

  async function logout() {
    await sb.auth.signOut();
    location.reload();
  }

  async function forgotPassword() {
    const email = document.getElementById('email').value.trim();
    const errorEl = document.getElementById('errorMsg');
    if (!email) {
      errorEl.textContent = 'กรุณากรอกอีเมลในช่องด้านบนก่อนกดลืมรหัสผ่าน';
      return;
    }
    errorEl.style.color = '#1a7a1a';
    errorEl.textContent = 'กำลังส่งลิงก์รีเซ็ตรหัสผ่าน...';
    const { error } = await sb.auth.resetPasswordForEmail(email);
    if (error) {
      errorEl.style.color = '#ef4444';
      errorEl.textContent = 'เกิดข้อผิดพลาด: ' + error.message;
    } else {
      errorEl.style.color = '#1a7a1a';
      errorEl.textContent = 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย';
    }
  }

  sb.auth.onAuthStateChange((event, session) => {
    const isVip = !!session;
    document.getElementById('loginBox').style.display  = isVip ? 'none'         : 'block';
    document.getElementById('logoutBtn').style.display = isVip ? 'block'        : 'none';
    document.getElementById('vipBadge').style.display  = isVip ? 'inline-block' : 'none';
    loadRates(isVip);
  });

  document.getElementById('convAmount').addEventListener('input', calcConvert);
  document.getElementById('convCurrency').addEventListener('change', calcConvert);
  document.getElementById('convType').addEventListener('change', calcConvert);

  setInterval(async () => {
    const { data: { session } } = await sb.auth.getSession();
    loadRates(!!session);
  }, 60000);
