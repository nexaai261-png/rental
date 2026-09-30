/* ===== DATA (mudah ditambah: cukup tambah objek baru) ===== */
const CARS = [
  {id:1,name:"Toyota Avanza",type:"MPV",seat:7,price:350000,trans:"Manual",fuel:"Bensin",color:"#4a6fa5",desc:"MPV keluarga yang irit dan lega, cocok untuk perjalanan bersama keluarga."},
  {id:2,name:"Honda Brio",type:"City Car",seat:5,price:300000,trans:"Otomatis",fuel:"Bensin",color:"#d9822b",desc:"City car lincah dan hemat, ideal untuk mobilitas dalam kota."},
  {id:3,name:"Toyota Innova",type:"MPV",seat:7,price:550000,trans:"Otomatis",fuel:"Diesel",color:"#3d4657",desc:"MPV premium dengan kabin nyaman untuk perjalanan jarak jauh."},
  {id:4,name:"Honda Civic",type:"Sedan",seat:5,price:750000,trans:"Otomatis",fuel:"Bensin",color:"#8b1e2d",desc:"Sedan sporty dan elegan untuk acara bisnis maupun perjalanan santai."},
  {id:5,name:"Toyota Fortuner",type:"SUV",seat:7,price:900000,trans:"Otomatis",fuel:"Diesel",color:"#1d2433",desc:"SUV tangguh dengan performa kuat untuk segala medan."}
];
const FACILITIES = ["AC","Audio","Bluetooth","USB Charger","Airbag","Kamera parkir"];
// perDay: true = dikali lama sewa, false = biaya tetap
const ADDONS = [
  {id:"shuttle",label:"Antar jemput mobil",cost:50000,perDay:false},
  {id:"driver",label:"Sopir",cost:250000,perDay:true},
  {id:"insurance",label:"Asuransi tambahan",cost:40000,perDay:true}
];
const STEPS = ["Pesanan Dibuat","Sedang Diproses","Disetujui","Sedang Berlangsung","Selesai"];

/* ===== UTILITAS ===== */
const $ = s => document.querySelector(s);
const rp = n => "Rp" + Number(n).toLocaleString("id-ID");
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const getCar = id => CARS.find(c => c.id === Number(id));
let toastTimer;
function toast(msg, type = "success") {
  const t = $("#toast");
  t.textContent = msg; t.className = "show " + type;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = "", 3200);
}
// Gambar mobil placeholder (SVG) agar tidak bergantung pada internet
function carImg(color) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f5f9'/><stop offset='1' stop-color='#d3d9e5'/></linearGradient></defs><rect width='400' height='200' fill='url(#g)'/><ellipse cx='200' cy='172' rx='150' ry='9' fill='#000' opacity='.15'/><path d='M46 146Q48 114 78 108L118 84Q134 70 160 70H246Q274 72 290 92L324 104Q356 110 356 138V152H46Z' fill='${color}'/><path d='M130 92L150 78H196V104H118ZM206 78H246Q262 82 274 104H206Z' fill='#cfe6f7'/><rect x='340' y='120' width='16' height='8' rx='3' fill='#ffe9a8'/><circle cx='118' cy='152' r='25' fill='#151515'/><circle cx='118' cy='152' r='11' fill='#bfc4cc'/><circle cx='288' cy='152' r='25' fill='#151515'/><circle cx='288' cy='152' r='11' fill='#bfc4cc'/></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* ===== NAVIGASI HALAMAN ===== */
const history_ = [];
let current = "home";
function showPage(id, push = true) {
  if (!$("#page-" + id)) return;
  if (push && id !== current) history_.push(current);
  current = id;
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + id));
  document.querySelectorAll("#menu a").forEach(a => a.classList.toggle("active", a.dataset.go === id));
  $("#menu").classList.remove("open");
  window.scrollTo(0, 0); // kembali ke atas
  if (id === "order") renderOrder();
  if (id === "status") renderMyOrders();
  if (id === "form") updateEstimate();
}
function goBack() { showPage(history_.pop() || "home", false); }

// Satu event listener untuk semua tombol/tautan data-*
document.addEventListener("click", e => {
  const el = e.target.closest("[data-go],[data-detail],[data-rent],[data-back]");
  if (!el) return;
  if (el.dataset.back !== undefined) return goBack();
  if (el.dataset.detail) return showDetail(el.dataset.detail);
  if (el.dataset.rent) { $("#car").value = el.dataset.rent; showPage("form"); updateEstimate(); return; }
  showPage(el.dataset.go);
});
$("#burger").addEventListener("click", () => $("#menu").classList.toggle("open"));

/* ===== DAFTAR & CARD MOBIL ===== */
function carCard(c) {
  return `<article class="card car"><img src="${carImg(c.color)}" alt="${c.name}">
    <div class="body"><h3>${c.name}</h3>
    <div class="tags"><span>${c.type}</span><span>${c.seat} orang</span></div>
    <div class="price">${rp(c.price)}<small>/hari</small></div>
    <div class="row"><button class="btn ghost dark" data-detail="${c.id}">Lihat Detail</button>
    <button class="btn gold" data-rent="${c.id}">Sewa Sekarang</button></div></div></article>`;
}
const renderCars = (el, list) => el.innerHTML = list.length ? list.map(carCard).join("") : "<p class='muted'>Tidak ada mobil yang cocok. Ubah atau reset filter.</p>";

/* ===== PENCARIAN & FILTER ===== */
function runSearch() {
  const name = $("#fName").value.trim().toLowerCase(), type = $("#fType").value, seat = $("#fSeat").value;
  const min = Number($("#fMin").value) || 0, max = Number($("#fMax").value) || Infinity;
  if (min > max) return toast("Harga minimum tidak boleh lebih besar dari maksimum.", "error");
  const res = CARS.filter(c => c.name.toLowerCase().includes(name) && (!type || c.type === type) &&
    (!seat || c.seat === Number(seat)) && c.price >= min && c.price <= max);
  $("#resultInfo").textContent = res.length + " mobil ditemukan";
  renderCars($("#searchGrid"), res);
}
$("#btnSearch").addEventListener("click", runSearch);
$("#btnReset").addEventListener("click", () => {
  ["fName", "fType", "fSeat", "fMin", "fMax"].forEach(i => $("#" + i).value = ""); runSearch();
});
["fName", "fMin", "fMax"].forEach(i => $("#" + i).addEventListener("keydown", e => e.key === "Enter" && runSearch()));

/* ===== DETAIL MOBIL ===== */
function showDetail(id) {
  const c = getCar(id); if (!c) return;
  $("#detailBox").innerHTML = `<div class="detail"><img src="${carImg(c.color)}" alt="${c.name}">
    <div><h2>${c.name}</h2><div class="price">${rp(c.price)}<small>/hari</small></div>
    <div class="spec"><div><small>Jenis</small>${c.type}</div><div><small>Kapasitas</small>${c.seat} orang</div>
    <div><small>Transmisi</small>${c.trans}</div><div><small>Bahan bakar</small>${c.fuel}</div></div>
    <b>Fasilitas</b><div class="fac">${FACILITIES.map(f => `<span>${f}</span>`).join("")}</div>
    <p class="muted">${c.desc}</p>
    <button class="btn gold" data-rent="${c.id}">Sewa Mobil</button></div></div>`;
  showPage("detail");
}

/* ===== FORM PEMINJAMAN ===== */
let draft = load("dr_draft", null);
$("#car").innerHTML = `<option value="">Pilih mobil</option>` + CARS.map(c => `<option value="${c.id}">${c.name} - ${rp(c.price)}/hari</option>`).join("");
$("#addons").innerHTML = ADDONS.map(a => `<label><input type="checkbox" value="${a.id}"> ${a.label}<small>${rp(a.cost)}${a.perDay ? "/hari" : ""}</small></label>`).join("");

function rentDays() {
  const s = $("#start").value, e = $("#end").value;
  if (!s || !e) return 0;
  const d = Math.round((new Date(e) - new Date(s)) / 86400000);
  return d < 0 ? 0 : Math.max(1, d); // minimal 1 hari
}
function calc(carId, days, addonIds) {
  const car = getCar(carId); if (!car || !days) return {base: 0, extra: 0, total: 0};
  const base = car.price * days;
  const extra = ADDONS.filter(a => addonIds.includes(a.id)).reduce((t, a) => t + a.cost * (a.perDay ? days : 1), 0);
  return {base, extra, total: base + extra};
}
const pickedAddons = () => [...document.querySelectorAll("#addons input:checked")].map(i => i.value);
function updateEstimate() {
  const d = rentDays();
  $("#days").value = d ? d + " hari" : "-";
  $("#estimate").textContent = rp(calc($("#car").value, d, pickedAddons()).total);
}
["start", "end", "car"].forEach(i => $("#" + i).addEventListener("change", updateEstimate));
$("#addons").addEventListener("change", updateEstimate);
$("#start").min = new Date().toISOString().split("T")[0];

function setErr(id, msg) {
  const f = $("#" + id); f.classList.toggle("bad", !!msg);
  const s = f.parentElement.querySelector(".err"); if (s) s.textContent = msg || "";
  return !msg;
}
$("#rentForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = id => $("#" + id).value.trim(), today = new Date().toISOString().split("T")[0];
  const ok = [
    setErr("name", v("name").length < 3 ? "Nama minimal 3 karakter." : ""),
    setErr("phone", /^(\+62|62|0)8\d{7,12}$/.test(v("phone").replace(/[\s-]/g, "")) ? "" : "Nomor HP tidak valid (contoh 08123456789)."),
    setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")) ? "" : "Format email tidak valid."),
    setErr("car", v("car") ? "" : "Pilih mobil terlebih dahulu."),
    setErr("start", !v("start") ? "Pilih tanggal mulai." : v("start") < today ? "Tanggal mulai tidak boleh sebelum hari ini." : ""),
    setErr("end", !v("end") ? "Pilih tanggal selesai." : v("end") < v("start") ? "Tanggal selesai harus setelah tanggal mulai." : "")
  ].every(Boolean);
  if (!ok) return toast("Periksa kembali isian form.", "error");
  const days = rentDays(), addons = pickedAddons(), price = calc(v("car"), days, addons);
  draft = {name: v("name"), phone: v("phone"), email: v("email"), carId: Number(v("car")),
    start: v("start"), end: v("end"), days, addons, ...price};
  save("dr_draft", draft);
  toast("Data tersimpan. Periksa ringkasan pemesanan.");
  showPage("order");
});

/* ===== PEMESANAN ===== */
const fmtDate = d => new Date(d).toLocaleDateString("id-ID", {day: "numeric", month: "long", year: "numeric"});
function renderOrder() {
  const box = $("#orderBox");
  if (!draft) {
    box.innerHTML = `<div class="card pad"><p class="muted">Belum ada pemesanan. Isi form peminjaman terlebih dahulu.</p><button class="btn gold" data-go="form">Isi Form</button></div>`;
    return;
  }
  const car = getCar(draft.carId), r = (a, b) => `<div class="inv-row"><span>${a}</span><span>${b}</span></div>`;
  const extras = ADDONS.filter(a => draft.addons.includes(a.id)).map(a => a.label).join(", ") || "Tidak ada";
  box.innerHTML = `<div class="card invoice"><div class="inv-head"><small>Ringkasan pemesanan</small><h3>Booking Confirmation</h3></div>
    ${r("Nama pelanggan", draft.name)}${r("Nomor HP", draft.phone)}${r("Mobil", car.name)}
    ${r("Tanggal mulai", fmtDate(draft.start))}${r("Tanggal selesai", fmtDate(draft.end))}${r("Lama sewa", draft.days + " hari")}
    ${r("Harga per hari", rp(car.price))}${r("Layanan tambahan", extras)}${r("Biaya tambahan", rp(draft.extra))}
    <div class="inv-row inv-total"><span>Total biaya</span><span>${rp(draft.total)}</span></div>
    <div class="inv-act row"><button class="btn gold" id="btnConfirm">Konfirmasi Peminjaman</button><button class="btn ghost dark" data-go="form">Ubah Data</button></div></div>`;
  $("#btnConfirm").addEventListener("click", confirmOrder);
}
function confirmOrder() {
  const orders = load("dr_orders", []);
  let no; do { no = "DR-" + Math.floor(1000 + Math.random() * 9000); } while (orders.some(o => o.no === no));
  orders.push({...draft, no, step: 1, created: Date.now()}); // step 1 = Sedang Diproses
  save("dr_orders", orders);
  draft = null; localStorage.removeItem("dr_draft");
  toast("Pemesanan berhasil dibuat!", "success");
  $("#orderBox").innerHTML = `<div class="card ok"><div class="tick">&#10003;</div><h3>Pemesanan berhasil dibuat</h3>
    <p class="muted">Nomor pemesanan Anda: <b>${no}</b><br>Simpan nomor ini untuk mengecek status.</p>
    <div class="row" style="justify-content:center"><button class="btn gold" id="goStatus">Cek Status</button><button class="btn ghost dark" data-go="home">Ke Beranda</button></div></div>`;
  $("#goStatus").addEventListener("click", () => { $("#orderNo").value = no; showPage("status"); checkStatus(); });
}

/* ===== STATUS PEMINJAMAN ===== */
function renderMyOrders() {
  const o = load("dr_orders", []);
  $("#myOrders").innerHTML = o.length ? "<small class='muted'>Pesanan Anda:</small>" + o.map(x => `<button data-no="${x.no}">${x.no}</button>`).join("") : "";
}
$("#myOrders").addEventListener("click", e => { if (e.target.dataset.no) { $("#orderNo").value = e.target.dataset.no; checkStatus(); } });
function checkStatus() {
  const no = $("#orderNo").value.trim().toUpperCase(), box = $("#statusBox");
  if (!no) return toast("Masukkan nomor pemesanan.", "error");
  const o = load("dr_orders", []).find(x => x.no === no);
  if (!o) { box.innerHTML = ""; return toast("Nomor pemesanan tidak ditemukan.", "error"); }
  const list = STEPS.map((s, i) => {
    const cls = (i < o.step || o.step === 4) ? "done" : i === o.step ? "now" : "";
    return `<li class="${cls}"><i>${cls === "done" ? "&#10003;" : "&#9675;"}</i>${s}</li>`;
  }).join("");
  box.innerHTML = `<hr style="border:0;border-top:1px solid var(--line);margin:8px 0"><p><b>${o.no}</b> - ${getCar(o.carId).name}, ${o.days} hari (${rp(o.total)})</p>
    <ul class="tl">${list}</ul>
    <button class="btn navy" id="btnSim" ${o.step >= 4 ? "disabled" : ""}>Simulasi Status Berikutnya</button>`;
  $("#btnSim").addEventListener("click", () => {
    const all = load("dr_orders", []), t = all.find(x => x.no === no);
    if (t && t.step < 4) { t.step++; save("dr_orders", all); toast("Status diperbarui: " + STEPS[t.step]); checkStatus(); }
  });
}
$("#btnCheck").addEventListener("click", checkStatus);
$("#orderNo").addEventListener("keydown", e => e.key === "Enter" && checkStatus());

/* ===== INISIALISASI ===== */
$("#heroImg").src = carImg("#c9a24a");
renderCars($("#popularGrid"), CARS.filter(c => [1, 4, 5].includes(c.id)));
renderCars($("#carsGrid"), CARS);
runSearch();
showPage("home", false);
