(function(){
"use strict";
var D = window.LISTINGS || [];
var app = document.getElementById("app");
var NB = " ";

/* ---------- helpers ---------- */
function $(s, r){ return (r||document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
function num(n){ return Math.round(n).toLocaleString("cs-CZ").replace(/\s/g, NB); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function price(x){ return x.nabidka === "prodej" ? num(x.cena) + NB + "Kč" : num(x.cena) + NB + "Kč" + "<small>/měsíc</small>"; }
function priceTxt(x){ return num(x.cena) + NB + "Kč" + (x.nabidka === "pronajem" ? "/měs." : ""); }
function short(n){ return n >= 1e6 ? (Math.round(n/1e5)/10).toString().replace(".", ",") + NB + "mil." : Math.round(n/1000) + NB + "tis."; }
function title(x){ return (x.nabidka === "prodej" ? "Prodej " : "Pronájem ") + (x.typ === "byt" ? "bytu " : "domu ") + x.dispozice + ", " + x.plocha + NB + "m²"; }
function loc(x){ return x.mesto === x.cast ? x.mesto : x.mesto + " – " + x.cast; }
function img(id, small){ return "img/" + id + (small ? "s" : "") + ".webp"; }
function ago(d){ return d === 0 ? "Nový dnes" : d === 1 ? "Včera" : d < 5 ? "Před " + d + " dny" : "Před " + d + " dny"; }
function byId(id){ for (var i=0;i<D.length;i++) if (D[i].id == id) return D[i]; return null; }
function store(k, v){ try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch(e){ return null; } }
var favs = store("rv_favs") || [];
function isFav(id){ return favs.indexOf(id) > -1; }
function toast(t){ var el = $(".toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(function(){ el.classList.remove("show"); }, 2200); }
function updFavCount(){ var c = $(".fav-count"); c.textContent = favs.length; c.hidden = !favs.length; }
var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>';
var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
var NAMES = ["Petra K.","Tomáš V.","Jana N.","Martin H.","Lucie D.","Jiří P.","Eva S.","Ondřej B.","Kateřina M.","Pavel R.","Veronika Š.","David L."];
var CITIES = (function(){ var m = {}; D.forEach(function(x){ m[x.mesto] = (m[x.mesto]||0) + 1; }); return Object.keys(m).sort(function(a,b){ return m[b]-m[a]; }).map(function(k){ return {n:k, c:m[k]}; }); })();
var PM2 = {"Praha":[152000,390],"Brno":[118000,330],"Liberec":[72000,240],"Plzeň":[82000,260],"Ostrava":[52000,210],"Olomouc":[84000,270],"Hradec Králové":[86000,270],"České Budějovice":[78000,250],"Pardubice":[80000,255],"Jablonec nad Nisou":[62000,215],"Zlín":[70000,230],"Ústí nad Labem":[42000,190]};

/* Czech typography: keep one-letter prepositions with the next word */
function tie(root){
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
  while ((n = w.nextNode())){
    if (!n.nodeValue.trim()) continue;
    var v = n.nodeValue.replace(/(^|[\s(„])([vkszaiouVKSZAIOU])\s+/g, "$1$2" + NB);
    v = v.replace(/(\d)\s+(Kč|m²|min|hodin|dní|let|%)/g, "$1" + NB + "$2");
    if (v !== n.nodeValue) n.nodeValue = v;
  }
}

function desc(x){
  var r = x.id;
  var open = x.typ === "byt"
    ? ["Nabízíme vlastní byt " + x.dispozice + " o ploše " + x.plocha + " m² v části " + x.cast + ".",
       "Prodáváme náš byt " + x.dispozice + ", ve kterém jsme bydleli posledních několik let.",
       "Světlý byt " + x.dispozice + " v lokalitě " + x.cast + " s dobrou dostupností do centra."][r % 3]
    : ["Rodinný dům " + x.dispozice + " s pozemkem " + num(x.pozemek) + " m² v klidné části " + x.cast + ".",
       "Nabízíme náš dům " + x.dispozice + " se zahradou, který jsme postavili pro vlastní bydlení."][r % 2];
  if (x.nabidka === "pronajem") open = open.replace("Prodáváme náš", "Pronajímáme náš").replace("Nabízíme vlastní", "Pronajímáme vlastní").replace("Nabízíme náš", "Pronajímáme náš");
  var state = {"Novostavba":"Jde o novostavbu, vše je nové a v záruce.","Po rekonstrukci":"Prošel celkovou rekonstrukcí – nová elektřina, rozvody vody, podlahy i koupelna.","Velmi dobrý":"Je ve velmi dobrém stavu, udržovaný a připravený k nastěhování.","Dobrý":"Je v dobrém stavu, drobné úpravy si nový majitel může udělat podle sebe."}[x.stav];
  var feat = x.vybava.length ? "K bytu patří " + x.vybava.join(", ") + "." : "";
  if (x.typ === "dum") feat = "K domu patří " + x.vybava.join(", ") + ".";
  var around = ["V docházkové vzdálenosti je škola, školka, obchody i zastávka MHD.","Za domem začíná park, do centra je to tramvají asi 15 minut.","V okolí je klid, obchod a lékař jsou do 5 minut pěšky.","Lokalita je oblíbená u rodin s dětmi, hřiště je hned za rohem."][r % 4];
  var end = x.nabidka === "prodej"
    ? "Prodáváme sami, bez realitní kanceláře, takže neplatíte žádnou provizi. Prohlídku domluvíme podle vašich možností, i o víkendu."
    : "Pronajímáme sami, bez realitky a bez provize. Kauce je ve výši dvou nájmů, smlouvu na rok s možností prodloužení.";
  return [open + " " + state, feat + " " + around, end];
}

/* ---------- cards ---------- */
function card(x){
  return '<article class="card rv" data-id="' + x.id + '">' +
    '<div class="c-img"><img src="' + img(x.foto[0], true) + '" alt="' + esc(title(x)) + '" loading="lazy" width="640" height="427">' +
    '<div class="c-tags">' + (x.dni <= 1 ? '<span class="tag tag-a">' + ago(x.dni) + '</span>' : "") + (x.overeno ? '<span class="tag">Ověřený majitel</span>' : "") + '</div>' +
    '<button class="fav' + (isFav(x.id) ? " on" : "") + '" data-fav="' + x.id + '" aria-label="Uložit inzerát" aria-pressed="' + isFav(x.id) + '">' + HEART + '</button></div>' +
    '<div class="c-body"><div class="c-price">' + price(x) + '</div><div class="c-title">' + title(x) + '</div><div class="c-loc">' + esc(loc(x)) + '</div>' +
    '<div class="c-meta"><span>' + (x.typ === "byt" ? x.patro + ". patro" : "Pozemek " + num(x.pozemek) + NB + "m²") + '</span><span>' + x.stav + '</span>' + (x.nabidka === "prodej" ? '<span>' + num(x.cena / x.plocha) + NB + 'Kč/m²</span>' : "") + '</div></div>' +
    '<a class="c-link" href="#/inzerat/' + x.id + '" aria-label="' + esc(title(x)) + ', ' + esc(loc(x)) + '"></a></article>';
}

/* ---------- router ---------- */
function parse(){
  var h = location.hash.replace(/^#/, "") || "/";
  var q = {}, path = h, i = h.indexOf("?");
  if (i > -1){ path = h.slice(0, i); h.slice(i+1).split("&").forEach(function(p){ var kv = p.split("="); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1]||"").replace(/\+/g, " ")); }); }
  var anchor = null, j = path.indexOf("#");
  if (j > -1){ anchor = path.slice(j+1); path = path.slice(0, j); }
  return {path: path, q: q, anchor: anchor};
}
var map = null, dmap = null;
function killMaps(){ if (map){ map.remove(); map = null; } if (dmap){ dmap.remove(); dmap = null; } }
var lastPath = null;
function route(){
  var r = parse();
  document.body.classList.remove("menu-open");
  $(".burger").setAttribute("aria-expanded", "false");
  var samePage = lastPath === r.path && r.path === "/nabidka";
  if (!samePage) killMaps();
  if (r.path === "/" || r.path === "") home();
  else if (r.path === "/nabidka") results(r.q, samePage);
  else if (r.path.indexOf("/inzerat/") === 0) detail(r.path.split("/")[2]);
  else if (r.path === "/majitele") owners();
  else if (r.path === "/oblibene") favPage();
  else home();
  $$(".nav a").forEach(function(a){
    var k = a.getAttribute("data-nav"), on = false;
    if (r.path === "/nabidka") on = (k === (r.q.nabidka || "prodej"));
    if (r.path === "/majitele") on = (k === "majitele" && r.anchor !== "odhad") || (k === "odhad" && r.anchor === "odhad");
    a.classList.toggle("on", on);
  });
  if (!samePage){
    tie(app);
    if (r.anchor){ var t = document.getElementById(r.anchor); if (t) setTimeout(function(){ t.scrollIntoView({behavior:"smooth", block:"start"}); }, 60); }
    else window.scrollTo(0, 0);
  }
  reveal();
  lastPath = r.path;
}
window.addEventListener("hashchange", route);

/* ---------- reveal on scroll ---------- */
var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }); }, {rootMargin:"0px 0px -6% 0px"}) : null;
function reveal(){ $$(".rv:not(.in)").forEach(function(el, i){ if (io){ el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); } else el.classList.add("in"); }); }

/* ---------- home ---------- */
function home(){
  var sale = D.filter(function(x){ return x.nabidka === "prodej"; }).length, rent = D.length - sale;
  app.innerHTML =
  '<section class="hero"><div class="wrap"><div class="hero-box">' +
    '<img class="hero-img" src="img/26.webp" alt="" width="1400" height="933">' +
    '<div class="hero-in">' +
      '<h1>Bydlení přímo od majitelů, bez provize realitky</h1>' +
      '<p class="hero-sub">Každý inzerát vložil člověk, který byt nebo dům vlastní. Napíšete mu napřímo a ušetříte statisíce.</p>' +
      searchBox() +
      '<div class="hero-stats"><div><b>' + D.length + '</b><span>ověřených nabídek</span></div><div><b>0' + NB + 'Kč</b><span>provize pro kupující</span></div><div><b>' + CITIES.length + '</b><span>měst v ČR</span></div></div>' +
    '</div></div></div></section>' +

  '<section class="sec"><div class="wrap"><div class="aud">' +
    '<div class="aud-c aud-own rv"><span class="aud-k">Pro majitele</span><h3>Prodejte nebo pronajměte sami a nechte si celou částku</h3><p>Vložíte inzerát za pár minut, my ho ukážeme tisícům lidí, kteří hledají. Pomůžeme s cenou, smlouvou i výběrem nájemníka.</p>' +
      '<div class="aud-links"><a class="btn btn-line" href="#/majitele#odhad">Odhad ceny zdarma</a><a class="btn btn-ghost" href="#/majitele">Jak to funguje</a></div></div>' +
    '<div class="aud-c aud-buy rv"><span class="aud-k">Pro zájemce</span><h3>Hledejte bez prostředníka a jednejte rovnou s majitelem</h3><p>Hypoteční kalkulačka u každého bytu, mapa se všemi nabídkami a upozornění na nové inzeráty ve vaší lokalitě.</p>' +
      '<div class="aud-links"><a class="btn btn-dark" href="#/nabidka?nabidka=prodej">Chci koupit</a><a class="btn btn-line" href="#/nabidka?nabidka=pronajem">Chci pronajmout</a></div></div>' +
  '</div></div></section>' +

  '<section class="sec"><div class="wrap"><div class="sec-h"><div><h2>Nejnovější nabídky</h2><p>Inzeráty přidané za poslední dny. Uložte si, co se vám líbí, srdíčkem.</p></div>' +
    '<div class="seg" role="tablist"><button class="on" data-home-tab="prodej">Prodej (' + sale + ')</button><button data-home-tab="pronajem">Pronájem (' + rent + ')</button></div></div>' +
    '<div class="grid" id="home-grid"></div><div class="more"><a class="btn btn-dark" id="home-more" href="#/nabidka?nabidka=prodej">Zobrazit všechny nabídky ' + ARROW + '</a></div></div></section>' +

  '<section class="sec"><div class="wrap"><div class="sec-h"><div><h2>Jak koupit bez realitky</h2><p>Bez prostředníka to jde rychleji a levněji. Na nic přitom nezůstanete sami.</p></div></div>' +
    '<div class="how">' +
      '<div class="how-c rv"><b>1</b><h3>Najdete a napíšete</h3><p>Zprávu dostane přímo majitel. Odpovídá většinou do 24 hodin a prohlídku domluvíte spolu.</p></div>' +
      '<div class="how-c rv"><b>2</b><h3>Prověříme nemovitost</h3><p>Zdarma zkontrolujeme katastr, zástavy a exekuce majitele, než podepíšete rezervaci.</p></div>' +
      '<div class="how-c rv"><b>3</b><h3>Podepíšete bezpečně</h3><p>Kupní smlouvu připraví advokát a peníze leží v úschově, dokud se nepřepíše vlastnictví.</p></div>' +
    '</div></div></section>' +

  '<section class="sec"><div class="wrap"><div class="sec-h"><div><h2>Hledat podle města</h2></div></div><div class="cities">' +
    CITIES.map(function(c){ return '<a class="city rv" href="#/nabidka?mesto=' + encodeURIComponent(c.n) + '"><span>' + c.n + '</span><small>' + c.c + '</small></a>'; }).join("") +
  '</div>' +

  '<div class="band rv"><div><h2>Kolik ušetříte, když nekupujete přes realitku</h2><p>U bytu za 6' + NB + 'milionů si běžná realitní kancelář řekne o 3 až 5' + NB + '% z ceny. Ty peníze zaplatíte vy, i když je to schované v ceně bytu.</p></div>' +
    '<div class="cmp"><div class="cmp-r"><span>Realitní kancelář (4' + NB + '%)</span><b>240' + NB + '000' + NB + 'Kč</b></div><div class="cmp-r"><span>Realitka s nižší provizí (3' + NB + '%)</span><b>180' + NB + '000' + NB + 'Kč</b></div><div class="cmp-r us"><span>StopRK, přímo od majitele</span><b>0' + NB + 'Kč</b></div></div></div>' +
  '</div></section>';

  bindSearch();
  function fill(kind){
    var list = D.filter(function(x){ return x.nabidka === kind; }).sort(function(a,b){ return a.dni - b.dni || b.id - a.id; }).slice(0, 8);
    $("#home-grid").innerHTML = list.map(card).join("");
    $("#home-more").setAttribute("href", "#/nabidka?nabidka=" + kind);
    tie($("#home-grid")); reveal();
  }
  fill("prodej");
  $$("[data-home-tab]").forEach(function(b){ b.onclick = function(){ $$("[data-home-tab]").forEach(function(o){ o.classList.toggle("on", o === b); }); fill(b.getAttribute("data-home-tab")); }; });
}

function searchBox(){
  return '<form class="search" id="search" autocomplete="off"><div class="s-tabs"><button type="button" class="s-tab on" data-k="prodej">Koupit</button><button type="button" class="s-tab" data-k="pronajem">Pronajmout</button></div>' +
    '<div class="s-row">' +
      '<div class="s-f"><label for="s-loc">Lokalita</label><input id="s-loc" placeholder="Město nebo čtvrť" aria-autocomplete="list"><div class="sugg" id="sugg"></div></div>' +
      '<div class="s-f"><label for="s-typ">Typ</label><select id="s-typ"><option value="">Byt i dům</option><option value="byt">Byt</option><option value="dum">Dům</option></select></div>' +
      '<div class="s-f"><label for="s-disp">Dispozice</label><select id="s-disp"><option value="">Jakákoli</option><option>1+kk</option><option>2+kk</option><option>2+1</option><option>3+kk</option><option>3+1</option><option>4+kk</option><option>5+1</option></select></div>' +
      '<div class="s-f"><label for="s-max">Cena do</label><select id="s-max"></select></div>' +
      '<button class="btn btn-a s-go" type="submit">Hledat</button>' +
    '</div></form>';
}
function maxOpts(kind){
  var v = kind === "prodej" ? [3e6,5e6,7e6,10e6,15e6,25e6] : [12000,18000,25000,35000,60000];
  return '<option value="">Bez omezení</option>' + v.map(function(n){ return '<option value="' + n + '">' + (kind === "prodej" ? short(n) + NB + "Kč" : num(n) + NB + "Kč") + '</option>'; }).join("");
}
function bindSearch(){
  var f = $("#search"), kind = "prodej", inp = $("#s-loc"), sg = $("#sugg"), hl = -1;
  $("#s-max").innerHTML = maxOpts(kind);
  $$(".s-tab", f).forEach(function(b){ b.onclick = function(){ kind = b.getAttribute("data-k"); $$(".s-tab", f).forEach(function(o){ o.classList.toggle("on", o === b); }); $("#s-max").innerHTML = maxOpts(kind); }; });
  var places = [];
  CITIES.forEach(function(c){ places.push({v:c.n, m:c.n, t:"město"}); });
  D.forEach(function(x){ if (!places.some(function(p){ return p.v === x.cast; }) && x.cast !== x.mesto) places.push({v:x.cast, m:x.mesto, t:x.mesto}); });
  function norm(s){ return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function show(){
    var q = norm(inp.value.trim()); hl = -1;
    var hits = places.filter(function(p){ return !q || norm(p.v).indexOf(q) > -1; }).slice(0, 6);
    if (!hits.length){ sg.classList.remove("show"); return; }
    sg.innerHTML = hits.map(function(p){ return '<button type="button" data-v="' + esc(p.v) + '" data-m="' + esc(p.m) + '">' + esc(p.v) + '<small>' + esc(p.t) + '</small></button>'; }).join("");
    sg.classList.add("show");
  }
  inp.addEventListener("focus", show); inp.addEventListener("input", show);
  inp.addEventListener("keydown", function(e){
    var bs = $$("button", sg); if (!bs.length || !sg.classList.contains("show")) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp"){ e.preventDefault(); hl = (hl + (e.key === "ArrowDown" ? 1 : -1) + bs.length) % bs.length; bs.forEach(function(b, i){ b.classList.toggle("hl", i === hl); }); }
    else if (e.key === "Enter" && hl > -1){ e.preventDefault(); bs[hl].click(); }
    else if (e.key === "Escape") sg.classList.remove("show");
  });
  sg.addEventListener("mousedown", function(e){ e.preventDefault(); });
  sg.addEventListener("click", function(e){ var b = e.target.closest("button"); if (!b) return; inp.value = b.getAttribute("data-v"); inp.setAttribute("data-m", b.getAttribute("data-m")); sg.classList.remove("show"); });
  inp.addEventListener("blur", function(){ setTimeout(function(){ sg.classList.remove("show"); }, 120); });
  f.onsubmit = function(e){
    e.preventDefault();
    var q = {nabidka: kind}, v = inp.value.trim();
    if (v){ var p = places.filter(function(p){ return norm(p.v) === norm(v); })[0] || places.filter(function(p){ return norm(p.v).indexOf(norm(v)) > -1; })[0]; if (p){ q.mesto = p.m; if (p.v !== p.m) q.cast = p.v; } else q.text = v; }
    if ($("#s-typ").value) q.typ = $("#s-typ").value;
    if ($("#s-disp").value) q.disp = $("#s-disp").value;
    if ($("#s-max").value) q.max = $("#s-max").value;
    go(q);
  };
}
function go(q){
  var s = Object.keys(q).filter(function(k){ return q[k] !== "" && q[k] != null; }).map(function(k){ return encodeURIComponent(k) + "=" + encodeURIComponent(q[k]); }).join("&");
  location.hash = "#/nabidka" + (s ? "?" + s : "");
}

/* ---------- results ---------- */
function filterList(q){
  var kind = q.nabidka || "";
  return D.filter(function(x){
    if (kind && x.nabidka !== kind) return false;
    if (q.typ && x.typ !== q.typ) return false;
    if (q.mesto && x.mesto !== q.mesto) return false;
    if (q.cast && x.cast !== q.cast) return false;
    if (q.disp && x.dispozice !== q.disp) return false;
    if (q.max && x.cena > +q.max) return false;
    if (q.text){ var t = (x.mesto + " " + x.cast + " " + x.kraj).toLowerCase(); if (t.indexOf(q.text.toLowerCase()) < 0) return false; }
    return true;
  }).sort(function(a, b){
    if (q.sort === "levne") return a.cena - b.cena;
    if (q.sort === "drahe") return b.cena - a.cena;
    if (q.sort === "m2") return (a.cena/a.plocha) - (b.cena/b.plocha);
    return a.dni - b.dni || b.id - a.id;
  });
}
function results(q, keep){
  var kind = q.nabidka || "prodej"; q.nabidka = kind;
  var list = filterList(q);
  var h = (kind === "prodej" ? "Na prodej" : "K pronájmu") + (q.typ === "byt" ? ": byty" : q.typ === "dum" ? ": domy" : "") + (q.cast ? ", " + q.cast : q.mesto ? ", " + q.mesto : q.text ? ", „" + esc(q.text) + "“" : ", celá ČR");
  var cnt = list.length + " " + (list.length === 1 ? "nabídka" : list.length > 1 && list.length < 5 ? "nabídky" : "nabídek") + " přímo od majitelů";
  if (!keep){
    app.innerHTML =
    '<div class="wrap"><div class="res-top"><div><h1 id="res-h"></h1><p id="res-c"></p></div>' +
      '<div class="seg view-sw" id="view-sw"><button class="on" data-v="list">Seznam</button><button data-v="map">Mapa</button></div></div>' +
    '<div class="filters"><div class="f-row" id="f-row"></div></div>' +
    '<div class="res" id="res"><div class="list-col"><div class="grid" id="res-grid"></div></div><div class="map-col"><div id="map"></div></div></div></div>';
    $$("#view-sw button").forEach(function(b){ b.onclick = function(){ $$("#view-sw button").forEach(function(o){ o.classList.toggle("on", o === b); }); $("#res").classList.toggle("show-map", b.getAttribute("data-v") === "map"); if (map) setTimeout(function(){ map.invalidateSize(); fit(); }, 30); }; });
    window.scrollTo(0, 0);
  }
  $("#res-h").textContent = h; $("#res-c").textContent = cnt;
  var mo = kind === "prodej" ? [3e6,5e6,7e6,10e6,15e6,25e6] : [12000,18000,25000,35000,60000];
  $("#f-row").innerHTML =
    '<button class="chip' + (kind === "prodej" ? " on" : "") + '" data-set="nabidka=prodej">Koupě</button><button class="chip' + (kind === "pronajem" ? " on" : "") + '" data-set="nabidka=pronajem">Pronájem</button><span class="f-sep"></span>' +
    '<button class="chip' + (!q.typ ? " on" : "") + '" data-set="typ=">Vše</button><button class="chip' + (q.typ === "byt" ? " on" : "") + '" data-set="typ=byt">Byty</button><button class="chip' + (q.typ === "dum" ? " on" : "") + '" data-set="typ=dum">Domy</button><span class="f-sep"></span>' +
    '<select class="chip" data-sel="mesto" aria-label="Město"><option value="">Celá ČR</option>' + CITIES.map(function(c){ return '<option' + (q.mesto === c.n ? " selected" : "") + '>' + c.n + '</option>'; }).join("") + '</select>' +
    '<select class="chip" data-sel="disp" aria-label="Dispozice"><option value="">Dispozice</option>' + ["1+kk","2+kk","2+1","3+kk","3+1","4+kk","5+1"].map(function(d){ return '<option' + (q.disp === d ? " selected" : "") + '>' + d + '</option>'; }).join("") + '</select>' +
    '<select class="chip" data-sel="max" aria-label="Cena do"><option value="">Cena do</option>' + mo.map(function(n){ return '<option value="' + n + '"' + (+q.max === n ? " selected" : "") + '>do ' + (kind === "prodej" ? short(n) : num(n)) + NB + 'Kč</option>'; }).join("") + '</select>' +
    '<div class="f-right"><select class="chip" data-sel="sort" aria-label="Řazení"><option value="">Nejnovější</option><option value="levne"' + (q.sort === "levne" ? " selected" : "") + '>Nejlevnější</option><option value="drahe"' + (q.sort === "drahe" ? " selected" : "") + '>Nejdražší</option>' + (kind === "prodej" ? '<option value="m2"' + (q.sort === "m2" ? " selected" : "") + '>Cena za m²</option>' : "") + '</select></div>';
  $$("[data-set]").forEach(function(b){ b.onclick = function(){ var kv = b.getAttribute("data-set").split("="); var n = Object.assign({}, q); n[kv[0]] = kv[1]; if (kv[0] === "nabidka"){ delete n.max; delete n.sort; } if (kv[0] === "mesto") delete n.cast; go(n); }; });
  $$("[data-sel]").forEach(function(s){ s.onchange = function(){ var n = Object.assign({}, q); n[s.getAttribute("data-sel")] = s.value; if (s.getAttribute("data-sel") === "mesto"){ delete n.cast; delete n.text; } go(n); }; });
  var g = $("#res-grid");
  g.innerHTML = list.length ? list.map(card).join("") : '<div class="empty"><h3>Tady zatím nic není</h3><p>Zkuste uvolnit filtry nebo hledat v celé ČR. Nové inzeráty přibývají každý den.</p><a class="btn btn-dark" href="#/nabidka?nabidka=' + kind + '">Zrušit filtry</a></div>';
  tie(app);
  drawMap(list);
  // hovering a card lights its pin
  $$(".card", g).forEach(function(c){
    c.addEventListener("mouseenter", function(){ var p = document.querySelector('.pin[data-id="' + c.getAttribute("data-id") + '"]'); if (p) p.classList.add("on"); });
    c.addEventListener("mouseleave", function(){ var p = document.querySelector('.pin[data-id="' + c.getAttribute("data-id") + '"]'); if (p) p.classList.remove("on"); });
  });
}
var markers = [];
function tiles(m){
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);
}
function fit(){
  if (!map) return;
  if (!markers.length){ map.setView([49.8, 15.5], 7); return; }
  var b = L.latLngBounds(markers.map(function(m){ return m.getLatLng(); }));
  map.fitBounds(b, {padding: [50, 50], maxZoom: 13});
}
function drawMap(list){
  if (!window.L) return;
  if (!map){ map = L.map("map", {scrollWheelZoom: false, zoomControl: true, zoomSnap: 0.25}); tiles(map); map.on("focus", function(){ map.scrollWheelZoom.enable(); }); }
  markers.forEach(function(m){ m.remove(); }); markers = [];
  list.forEach(function(x){
    var icon = L.divIcon({className: "", html: '<span class="pin" data-id="' + x.id + '">' + (x.nabidka === "prodej" ? short(x.cena) : num(x.cena)) + '</span>', iconSize: null});
    var mk = L.marker([x.lat, x.lng], {icon: icon, title: title(x)}).addTo(map);
    mk.bindPopup('<a class="pop" href="#/inzerat/' + x.id + '"><img src="' + img(x.foto[0], true) + '" alt=""><div><b>' + priceTxt(x) + '</b><span>' + title(x) + '<br>' + esc(loc(x)) + '</span></div></a>', {closeButton: false, minWidth: 240});
    mk.on("mouseover", function(){ var c = document.querySelector('.card[data-id="' + x.id + '"]'); if (c) c.classList.add("hl"); });
    mk.on("mouseout", function(){ var c = document.querySelector('.card[data-id="' + x.id + '"]'); if (c) c.classList.remove("hl"); });
    markers.push(mk);
  });
  setTimeout(function(){ map.invalidateSize(); fit(); }, 0);
}

/* ---------- detail ---------- */
function detail(id){
  var x = byId(id);
  if (!x){ app.innerHTML = '<div class="wrap"><div class="empty" style="margin-top:40px"><h3>Inzerát už není k dispozici</h3><p>Majitel ho nejspíš prodal nebo pronajal.</p><a class="btn btn-dark" href="#/nabidka">Zpět na nabídky</a></div></div>'; return; }
  var owner = NAMES[x.id % NAMES.length], ini = owner.split(" ").map(function(s){ return s[0]; }).join("");
  var d = desc(x);
  var similar = D.filter(function(o){ return o.id !== x.id && o.nabidka === x.nabidka && (o.mesto === x.mesto || o.typ === x.typ); }).slice(0, 4);
  var params = [["Cena", priceTxt(x)], ["Dispozice", x.dispozice], ["Užitná plocha", x.plocha + NB + "m²"]];
  if (x.typ === "dum") params.push(["Pozemek", num(x.pozemek) + NB + "m²"]); else params.push(["Podlaží", x.patro + ". patro"]);
  params = params.concat([["Stav", x.stav], ["Vlastnictví", x.vlastnictvi], ["Energetická třída", x.energie], ["Vybavení", x.vybava.map(function(v){ return v[0].toUpperCase() + v.slice(1); }).join(", ")], ["Lokalita", loc(x)], ["Číslo inzerátu", "RV-" + x.id]]);
  var side = x.nabidka === "prodej"
    ? '<div class="box calc"><h3>Kolik budete splácet</h3>' +
        '<div class="rng"><label for="c-own">Vlastní zdroje <b id="c-own-v"></b></label><input type="range" id="c-own" min="10" max="60" step="5" value="20"></div>' +
        '<div class="rng"><label for="c-yrs">Doba splácení <b id="c-yrs-v"></b></label><input type="range" id="c-yrs" min="10" max="35" step="5" value="30"></div>' +
        '<div class="rng"><label for="c-rate">Úrok <b id="c-rate-v"></b></label><input type="range" id="c-rate" min="3" max="7" step="0.1" value="4.6"></div>' +
        '<div class="calc-out"><span>Měsíční splátka</span><b id="c-out"></b></div><p class="calc-note" id="c-note"></p></div>'
    : '<div class="box"><h3 style="font-size:18px;margin-bottom:14px">Měsíční náklady</h3><div class="cost"><div><span>Nájem</span><b>' + num(x.cena) + NB + 'Kč</b></div><div><span>Zálohy na služby a energie</span><b>' + num(x.poplatky) + NB + 'Kč</b></div><div><span>Celkem měsíčně</span><span>' + num(x.cena + x.poplatky) + NB + 'Kč</span></div></div><p class="calc-note">Vratná kauce ' + num(x.cena * 2) + NB + 'Kč. Žádná provize realitce.</p></div>';

  app.innerHTML =
  '<div class="wrap"><nav class="crumbs" aria-label="Drobečková navigace"><a href="#/">Úvod</a><span>/</span><a href="#/nabidka?nabidka=' + x.nabidka + '">' + (x.nabidka === "prodej" ? "Prodej" : "Pronájem") + '</a><span>/</span><a href="#/nabidka?nabidka=' + x.nabidka + '&mesto=' + encodeURIComponent(x.mesto) + '">' + x.mesto + '</a></nav>' +
  '<div class="gal">' + x.foto.slice(0, 5).map(function(f, i){ return '<button class="g" data-lb="' + i + '" aria-label="Fotka ' + (i+1) + '"><img src="' + img(f, i > 0) + '" alt="' + esc(title(x)) + ', fotka ' + (i+1) + '"' + (i ? ' loading="lazy"' : "") + '></button>'; }).join("") +
    '<button class="btn btn-line btn-sm gal-all" data-lb="0">Všech ' + x.foto.length + ' fotek</button></div>' +
  '<div class="det"><div>' +
    '<div class="det-h"><h1>' + title(x) + '</h1><div class="loc">' + esc(loc(x)) + ', ' + x.kraj + '</div>' +
      '<div class="det-tags">' + (x.overeno ? '<span class="tag tag-ok">Ověřený majitel</span>' : "") + '<span class="tag">Bez provize</span><span class="tag">' + ago(x.dni) + '</span></div></div>' +
    '<div class="facts"><div><small>Cena</small><b>' + priceTxt(x) + '</b></div><div><small>Plocha</small><b>' + x.plocha + NB + 'm²</b></div><div><small>' + (x.nabidka === "prodej" ? "Cena za m²" : "Za m² měsíčně") + '</small><b>' + num(x.cena / x.plocha) + NB + 'Kč</b></div><div><small>' + (x.typ === "dum" ? "Pozemek" : "Patro") + '</small><b>' + (x.typ === "dum" ? num(x.pozemek) + NB + "m²" : x.patro + ".") + '</b></div></div>' +
    '<h2>Popis od majitele</h2><div class="desc">' + d.map(function(p){ return "<p>" + p + "</p>"; }).join("") + '</div>' +
    '<h2>Parametry</h2><div class="params">' + params.map(function(p){ return '<div><span>' + p[0] + '</span><b>' + p[1] + '</b></div>'; }).join("") + '</div>' +
    '<h2>Kde to je</h2><div class="dmap-box"><div id="dmap"></div></div>' +
    (x.nabidka === "prodej" ? '<h2>Cena v okolí</h2><p class="desc">Průměrná nabídková cena ' + (x.typ === "byt" ? "bytů" : "domů") + ' v lokalitě ' + x.mesto + ' je' + num((PM2[x.mesto]||[80000])[0]) + NB + 'Kč/m². Tento inzerát je ' + (function(){ var r = (x.cena / x.plocha) / (PM2[x.mesto]||[80000])[0] - 1; return Math.abs(r) < .03 ? "zhruba na průměru." : (r < 0 ? Math.round(-r*100) + NB + "% pod průměrem." : Math.round(r*100) + NB + "% nad průměrem."); })() + '</p>' : "") +
  '</div>' +
  '<aside class="side"><div class="box"><div class="box-price">' + priceTxt(x) + '</div><div class="box-sub">' + (x.nabidka === "prodej" ? num(x.cena / x.plocha) + NB + "Kč/m², bez provize" : "+ " + num(x.poplatky) + NB + "Kč zálohy na služby") + '</div>' +
    '<div class="owner"><div class="ava">' + ini + '</div><div><b>' + owner + '</b><small>Majitel, odpovídá obvykle do 1' + NB + 'hodiny</small></div></div>' +
    '<form class="form" id="contact"><input class="inp" required placeholder="Jméno a příjmení" autocomplete="name"><input class="inp" type="email" required placeholder="E-mail" autocomplete="email"><input class="inp" type="tel" placeholder="Telefon (nepovinné)" autocomplete="tel"><textarea class="inp" required>Dobrý den, zaujal mě váš inzerát „' + title(x) + '“. Rád(a) bych se přišel(a) podívat. Kdy by se vám to hodilo?</textarea><button class="btn btn-a" type="submit">Napsat majiteli</button><div class="form-ok" id="contact-ok">Hotovo. V ostrém provozu by zpráva teď odešla majiteli, tady jde jen o ukázku.</div></form>' +
    '<button class="btn btn-line" style="width:100%;margin-top:10px" data-fav="' + x.id + '" id="det-fav"></button></div>' + side + '</aside></div>' +
  (similar.length ? '<section class="sec"><div class="sec-h"><div><h2>Podobné nabídky</h2></div></div><div class="grid">' + similar.map(card).join("") + '</div></section>' : "") +
  '</div>' +
  '<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Fotky"><img alt=""><button class="lb-x" aria-label="Zavřít">✕</button><button class="lb-p" aria-label="Předchozí">‹</button><button class="lb-n" aria-label="Další">›</button><div class="lb-c"></div></div>';

  function favLbl(){ var b = $("#det-fav"); b.innerHTML = (isFav(x.id) ? "Uloženo v oblíbených" : "Uložit do oblíbených"); }
  favLbl(); $("#det-fav").addEventListener("click", function(){ setTimeout(favLbl, 0); });
  $("#contact").onsubmit = function(e){ e.preventDefault(); $("#contact-ok").style.display = "block"; $("#contact .btn").disabled = true; };
  // lightbox
  var lb = $("#lb"), li = 0;
  function lbShow(i){ li = (i + x.foto.length) % x.foto.length; $("img", lb).src = img(x.foto[li]); $(".lb-c", lb).textContent = (li+1) + " / " + x.foto.length; lb.classList.add("show"); document.body.style.overflow = "hidden"; }
  function lbHide(){ lb.classList.remove("show"); document.body.style.overflow = ""; }
  $$("[data-lb]").forEach(function(b){ b.onclick = function(){ lbShow(+b.getAttribute("data-lb")); }; });
  $(".lb-x", lb).onclick = lbHide; $(".lb-p", lb).onclick = function(){ lbShow(li - 1); }; $(".lb-n", lb).onclick = function(){ lbShow(li + 1); };
  lb.onclick = function(e){ if (e.target === lb) lbHide(); };
  document.onkeydown = function(e){ if (!lb.classList.contains("show")) return; if (e.key === "Escape") lbHide(); if (e.key === "ArrowLeft") lbShow(li - 1); if (e.key === "ArrowRight") lbShow(li + 1); };
  var sx = null; lb.addEventListener("touchstart", function(e){ sx = e.touches[0].clientX; }, {passive: true});
  lb.addEventListener("touchend", function(e){ if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) lbShow(li + (dx < 0 ? 1 : -1)); sx = null; });
  // mortgage
  if (x.nabidka === "prodej"){
    var calc = function(){
      var own = +$("#c-own").value, yrs = +$("#c-yrs").value, rate = +$("#c-rate").value;
      var loan = x.cena * (1 - own/100), r = rate/100/12, n = yrs*12;
      var pay = loan * r / (1 - Math.pow(1 + r, -n));
      $("#c-own-v").textContent = own + NB + "% (" + short(x.cena * own/100) + NB + "Kč)";
      $("#c-yrs-v").textContent = yrs + NB + "let"; $("#c-rate-v").textContent = rate.toFixed(1).replace(".", ",") + NB + "%";
      $("#c-out").textContent = num(pay) + NB + "Kč";
      $("#c-note").textContent = "Úvěr " + num(loan) + NB + "Kč. Orientační výpočet, přesnou nabídku vám spočítá banka." + (own < 20 ? " Pod 20" + NB + "% vlastních zdrojů vám banka hypotéku do 36 let věku půjčí, starším jen do 80" + NB + "%." : "");
    };
    ["c-own","c-yrs","c-rate"].forEach(function(i){ $("#" + i).addEventListener("input", calc); }); calc();
  }
  if (window.L){
    dmap = L.map("dmap", {scrollWheelZoom: false}).setView([x.lat, x.lng], 14); tiles(dmap);
    L.circle([x.lat, x.lng], {radius: 260, color: "#2340d0", weight: 2, fillColor: "#2340d0", fillOpacity: .12}).addTo(dmap);
  }
}

/* ---------- owners ---------- */
function owners(){
  var opts = Object.keys(PM2).map(function(c){ return "<option>" + c + "</option>"; }).join("");
  app.innerHTML =
  '<div class="wrap"><section class="own-hero"><div><h1>Prodejte nebo pronajměte bez realitky a nechte si celou částku</h1><p>Vložíte inzerát, odpovídáte zájemcům a o všem rozhodujete vy. S cenou, smlouvou a ověřením nájemníka vám pomůžeme, když budete chtít.</p>' +
    '<div class="aud-links" id="vlozit"><a class="btn btn-a" href="#/majitele#cenik">Vložit inzerát</a><a class="btn btn-line" href="#/majitele#odhad">Nejdřív odhad ceny</a></div></div>' +
    '<div class="own-img rv"><img src="img/19.webp" alt="Světlý obývací pokoj připravený k focení inzerátu"></div></section>' +

  '<section class="sec" id="odhad"><div class="sec-h"><div><h2>Kolik dnes stojí vaše nemovitost</h2><p>Odhad podle průměrných nabídkových cen ve vašem městě. Přesnou cenu spočítá náš odhadce po prohlídce.</p></div></div>' +
    '<div class="est"><div class="est-in">' +
      '<label>Město<select class="inp" id="e-city">' + opts + '</select></label>' +
      '<div class="est-two"><label>Typ<select class="inp" id="e-typ"><option value="byt">Byt</option><option value="dum">Dům</option></select></label><label>Plocha v m²<input class="inp" id="e-m2" type="number" min="15" max="500" value="65" inputmode="numeric"></label></div>' +
      '<label>Stav<select class="inp" id="e-stav"><option value="1.12">Novostavba</option><option value="1.05">Po rekonstrukci</option><option value="1" selected>Dobrý, udržovaný</option><option value="0.86">Před rekonstrukcí</option></select></label>' +
      '<div class="est-two"><label>Balkon nebo terasa<select class="inp" id="e-balk"><option value="1.03">Ano</option><option value="1">Ne</option></select></label><label>Parkování<select class="inp" id="e-park"><option value="1">Ne</option><option value="1.04">Ano</option></select></label></div>' +
    '</div><div class="est-out"><small>Odhadovaná prodejní cena</small><div class="big" id="e-out"></div><div class="est-bar"><i id="e-dot"></i></div><small id="e-range"></small><div class="mid" id="e-rent"></div><p>Prodejem bez realitky ušetříte asi <b id="e-save"></b> na provizi.</p><a class="btn" href="#/majitele#cenik">Vložit inzerát s touto cenou</a></div></div></section>' +

  '<section class="sec"><div class="sec-h"><div><h2>Jak prodej probíhá</h2></div></div><div class="how">' +
    '<div class="how-c rv"><b>1</b><h3>Vložíte inzerát</h3><p>Fotky z mobilu stačí, texty vám pomůžeme učesat. Zveřejníme ho do hodiny.</p></div>' +
    '<div class="how-c rv"><b>2</b><h3>Ukazujete zájemcům</h3><p>Zprávy chodí do jedné schránky, prohlídky si plánujete sami v kalendáři.</p></div>' +
    '<div class="how-c rv"><b>3</b><h3>Podepíšete u advokáta</h3><p>Smlouvu a úschovu peněz zařídí partnerský advokát za pevnou cenu.</p></div></div></section>' +

  '<section class="sec" id="cenik"><div class="sec-h"><div><h2>Ceník inzerce</h2><p>Platíte jednou za inzerát. Žádná provize z prodejní ceny.</p></div></div><div class="price">' +
    '<div class="pr rv"><h3>Základ</h3><div class="p">0' + NB + 'Kč</div><ul><li>Inzerát na 30 dní</li><li>Až 20 fotek</li><li>Zprávy od zájemců</li></ul><button class="btn btn-line" data-demo>Vybrat</button></div>' +
    '<div class="pr top rv"><h3>Komplet</h3><div class="p">2' + NB + '490' + NB + 'Kč <small>jednorázově</small></div><ul><li>Inzerát do prodeje</li><li>Profesionální fotky a půdorys</li><li>Zveřejnění na dalších portálech</li><li>Odhad ceny odhadcem</li></ul><button class="btn btn-a" data-demo>Vybrat</button></div>' +
    '<div class="pr rv"><h3>S advokátem</h3><div class="p">9' + NB + '900' + NB + 'Kč <small>jednorázově</small></div><ul><li>Vše z balíčku Komplet</li><li>Kupní smlouva a úschova</li><li>Návrh na vklad do katastru</li></ul><button class="btn btn-line" data-demo>Vybrat</button></div></div></section>' +

  '<section class="sec"><div class="sec-h"><div><h2>Časté otázky</h2></div></div><div class="faq">' +
    '<details><summary>Opravdu to zvládnu bez realitky?</summary><p>Většina majitelů ano. Nejvíc práce je s fotkami, prohlídkami a smlouvou. Fotky a smlouvu vám zařídíme, prohlídky si plánujete sami a znáte svůj byt nejlépe.</p></details>' +
    '<details><summary>Jak ověřujete nájemníky?</summary><p>Zkontrolujeme jejich totožnost a projdeme registry exekucí, insolvencí a dlužníků. Výsledek uvidíte dřív, než podepíšete smlouvu.</p></details>' +
    '<details><summary>Co když se mi ozve realitní makléř?</summary><p>Makléři mají v podmínkách zakázáno nabízet služby přes zprávy u inzerátu. Takovou zprávu nám nahlaste jedním kliknutím a účet zablokujeme.</p></details>' +
    '<details><summary>Kdy platím za inzerát?</summary><p>Základní inzerát je zdarma. Za balíček platíte až při zveřejnění, jednou a pevnou částku.</p></details>' +
  '</div></section></div>';

  $$("[data-demo]").forEach(function(b){ b.onclick = function(){ toast("Toto je ukázka, platba ani registrace tu nejsou."); }; });
  var est = function(){
    var c = $("#e-city").value, m2 = Math.max(15, Math.min(500, +$("#e-m2").value || 0)), t = $("#e-typ").value;
    var base = PM2[c][0] * (t === "dum" && c !== "Praha" ? .82 : 1) * +$("#e-stav").value * +$("#e-balk").value * +$("#e-park").value;
    var v = base * m2, lo = v * .93, hi = v * 1.07;
    $("#e-out").textContent = num(Math.round(v / 1e4) * 1e4) + NB + "Kč";
    $("#e-range").textContent = "Rozpětí " + short(lo) + " až " + short(hi) + NB + "Kč";
    $("#e-rent").textContent = "Pronájem asi " + num(Math.round(PM2[c][1] * m2 / 100) * 100) + NB + "Kč měsíčně";
    $("#e-save").textContent = num(Math.round(v * .04 / 1000) * 1000) + NB + "Kč";
    var pct = Math.max(4, Math.min(96, (base - 40000) / (170000 - 40000) * 100));
    $("#e-dot").style.left = pct + "%";
  };
  ["e-city","e-typ","e-m2","e-stav","e-balk","e-park"].forEach(function(i){ $("#" + i).addEventListener("input", est); $("#" + i).addEventListener("change", est); });
  est();
}

/* ---------- favourites ---------- */
function favPage(){
  var list = D.filter(function(x){ return isFav(x.id); });
  app.innerHTML = '<div class="wrap"><div class="res-top"><div><h1>Uložené inzeráty</h1><p>' + (list.length ? list.length + " uložených, zůstanou vám v tomto prohlížeči." : "Zatím nic. Uložte si inzerát srdíčkem.") + '</p></div></div>' +
    '<div class="grid">' + (list.length ? list.map(card).join("") : '<div class="empty"><h3>Seznam je prázdný</h3><p>Když se vám nějaký byt nebo dům zalíbí, klikněte na srdíčko na jeho fotce.</p><a class="btn btn-dark" href="#/nabidka">Procházet nabídky</a></div>') + '</div></div>';
}

/* ---------- global events ---------- */
document.addEventListener("click", function(e){
  var f = e.target.closest("[data-fav]");
  if (f){
    e.preventDefault(); e.stopPropagation();
    var id = +f.getAttribute("data-fav"), i = favs.indexOf(id);
    if (i > -1) favs.splice(i, 1); else favs.push(id);
    store("rv_favs", favs); updFavCount();
    $$('[data-fav="' + id + '"]').forEach(function(b){ b.classList.toggle("on", isFav(id)); b.setAttribute("aria-pressed", isFav(id)); });
    toast(isFav(id) ? "Uloženo do oblíbených" : "Odebráno z oblíbených");
  }
});
$(".burger").addEventListener("click", function(){ var o = document.body.classList.toggle("menu-open"); this.setAttribute("aria-expanded", o); });

updFavCount();
tie(document.querySelector(".foot"));
route();
})();
