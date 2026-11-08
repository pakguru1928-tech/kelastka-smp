/* KelasTKA+ — perender teks soal untuk aplikasi.
 * Markup: paragraf dipisah baris kosong; satu baris baru = <br>; **tebal**; *miring*;
 * tabel pipa markdown; [[gambar:ID]] atau [[gambar:https://lh3.googleusercontent.com/...]]; rumus $...$ / $$...$$.
 * ctx = { aset: {id:{alt, ket, siap, d}}, math: {tex: html} }
 * Rumus dicari di ctx.math (dirender saat paket dibangun). Bila tidak ada dan KaTeX sudah dimuat, dirender di tempat.
 */
(function (root) {
  "use strict";
  var URL_GAMBAR = /^https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_\-\/=?.&]+$/;
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function math(tex, display, ctx) {
    var m = (ctx && ctx.math) || {};
    var hit = display ? (m["D:" + tex] || m[tex]) : m[tex];
    if (hit) return hit;
    if (root.katex) {
      try { return root.katex.renderToString(tex, { throwOnError: false, displayMode: !!display }); } catch (e) { /* teks biasa */ }
    } else if (root.KTKA_BUTUH_KATEX) root.KTKA_BUTUH_KATEX();
    return '<code class="tex">' + esc(tex) + "</code>";
  }
  function fmt(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
    return s;
  }
  function inline(s, ctx) {
    var out = "", re = /\$([^$]+)\$/g, last = 0, m;
    s = String(s == null ? "" : s);
    while ((m = re.exec(s)) !== null) {
      out += fmt(s.slice(last, m.index)) + math(m[1], false, ctx);
      last = re.lastIndex;
    }
    return out + fmt(s.slice(last));
  }
  function table(lines, ctx) {
    var rows = lines.map(function (l) {
      return l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
    });
    var h = '<div class="tabel-geser"><table class="tb"><thead><tr>' + rows[0].map(function (c) { return "<th>" + inline(c, ctx) + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.slice(2).forEach(function (r) { h += "<tr>" + r.map(function (c) { return "<td>" + inline(c, ctx) + "</td>"; }).join("") + "</tr>"; });
    return h + "</tbody></table></div>";
  }
  function gambar(id, ctx) {
    if (URL_GAMBAR.test(id)) return '<figure><img loading="lazy" src="' + esc(id) + '" alt=""></figure>';
    var a = ((ctx && ctx.aset) || {})[id];
    if (!a) return '<figure class="gb-kosong"><div>[Gambar ' + esc(id) + ']</div></figure>';
    if (!a.siap || !a.d) return '<figure class="gb-kosong"><div><b>Ilustrasi:</b> ' + esc(a.alt || "") + "</div></figure>";
    return '<figure><img src="' + esc(a.d) + '" alt="' + esc(a.alt || "") + '">' + (a.ket ? "<figcaption>" + inline(a.ket, ctx) + "</figcaption>" : "") + "</figure>";
  }
  function render(text, ctx) {
    if (!text) return "";
    var blocks = String(text).replace(/\r/g, "").split(/\n\s*\n/);
    return blocks.map(function (b) {
      var t = b.trim(), lines = b.split("\n");
      var g = t.match(/^\[\[gambar:([^\]\s]+)\]\]$/);
      if (g) return gambar(g[1], ctx);
      if (lines.length >= 2 && /^\s*\|/.test(lines[0]) && /^\s*\|?\s*:?-{2,}/.test(lines[1])) return table(lines, ctx);
      var m = t.match(/^\$\$([\s\S]+)\$\$$/);
      if (m) return '<div class="rumus">' + math(m[1], true, ctx) + "</div>";
      return "<p>" + lines.map(function (l) {
        var gi = l.trim().match(/^\[\[gambar:([^\]\s]+)\]\]$/);
        return gi ? gambar(gi[1], ctx) : inline(l, ctx);
      }).join("<br>") + "</p>";
    }).join("");
  }
  /** Kumpulkan semua rumus dalam teks (untuk dirender sekali saat paket guru dibekukan). */
  function rumus(text) {
    var out = [], s = String(text || ""), re = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g, m;
    while ((m = re.exec(s)) !== null) out.push(m[1] ? { tex: m[1], d: true } : { tex: m[2], d: false });
    return out;
  }
  var NAMA_BENTUK = { "PG": "Pilihan Ganda", "PGK-MCMA": "Pilihan Ganda Kompleks", "PGK-Kategori": "Pilihan Ganda Kompleks (Kategori)" };
  var SINGKAT_BENTUK = { "PG": "PG", "PGK-MCMA": "PGK", "PGK-Kategori": "Kategori" };
  root.KTKA = { render: render, inline: inline, esc: esc, rumus: rumus, NAMA_BENTUK: NAMA_BENTUK, SINGKAT_BENTUK: SINGKAT_BENTUK, HURUF: "ABCDE" };
})(typeof window !== "undefined" ? window : globalThis);
