/* ==========================================================================
   Gemeinsame Logik: Syntaxhervorhebung, Listings, Live-Vorschauen,
   Uebungsnummerierung, Fortschritt, Inhaltsverzeichnis, Farbschema.
   ========================================================================== */

(function () {
	"use strict";

	var PREFIX = "skript.svg.";
	var PAGE = location.pathname.split("/").pop() || "index.html";

	/* Eine SVG-Datei ist kein ganzes Dokument. Damit sie in einer Vorschau
	   sitzt wie in einem frischen Browserfenster, wird sie in den <body>
	   gestellt und mit diesem Stil zentriert. */
	var SVG_DEMO_CSS =
		"html, body { margin: 0; height: 100%; }\n" +
		"body { display: flex; align-items: center; justify-content: center;\n" +
		"       padding: 8px; box-sizing: border-box; background: #fff; }\n" +
		"svg { max-width: 100%; max-height: 100%; }\n";

	/* ---------------------------------------------------------------- Speicher */

	var store = {
		get: function (key) {
			try {
				return localStorage.getItem(PREFIX + key);
			} catch (e) {
				return null;
			}
		},
		set: function (key, value) {
			try {
				localStorage.setItem(PREFIX + key, value);
				return true;
			} catch (e) {
				return false;
			}
		},
		del: function (key) {
			try {
				localStorage.removeItem(PREFIX + key);
			} catch (e) {
				/* ignorieren */
			}
		},
		keys: function () {
			var out = [];
			try {
				for (var i = 0; i < localStorage.length; i++) {
					var k = localStorage.key(i);
					if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
				}
			} catch (e) {
				/* ignorieren */
			}
			return out;
		},
	};

	/* --------------------------------------------------------------- Loesungen */

	/* Die Loesungsvorschlaege stehen normalerweise nicht auf der Seite -- die
	   Schueler sollen sie im Skript nachschlagen. Mit ?loesungen=1 schaltet die
	   Lehrperson sie fuer diesen Browser ein, mit ?loesungen=0 wieder aus.
	   Das ist eine Bequemlichkeit fuer den Unterricht und kein Schloss: der
	   Quelltext der Seite und window.EXAMPLES enthalten sie weiterhin. */
	var SHOW_SOL = (function () {
		var m = /[?&]loesungen=([01])/.exec(location.search);
		if (m) store.set("loesungen", m[1]);
		return store.get("loesungen") === "1";
	})();

	/* ------------------------------------------------------- Syntaxhervorhebung */

	function esc(s) {
		return s
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	var WS = /\s/;

	function isIdent(c) {
		return c && /[A-Za-z0-9_:.#%@$-]/.test(c);
	}

	/* Tokenisiert CSS zu [Klasse, Text]-Paaren. Klasse "" heisst: ohne Farbe. */
	function tokenizeCSS(src) {
		var out = [];
		var i = 0;
		var n = src.length;
		var inBlock = 0;

		function push(cls, text) {
			if (text) out.push([cls, text]);
		}

		while (i < n) {
			var c = src[i];

			if (c === "/" && src[i + 1] === "*") {
				var end = src.indexOf("*/", i + 2);
				end = end === -1 ? n : end + 2;
				push("t-com", src.slice(i, end));
				i = end;
				continue;
			}

			if (WS.test(c)) {
				var j = i;
				while (j < n && WS.test(src[j])) j++;
				push("", src.slice(i, j));
				i = j;
				continue;
			}

			if (c === "}") {
				push("t-punct", "}");
				i++;
				if (inBlock > 0) inBlock--;
				continue;
			}

			/* Bis zum naechsten strukturgebenden Zeichen schauen: kommt "{" zuerst,
			   ist es ein Selektor, sonst eine Deklaration. */
			var k = i;
			var brace = -1;
			var semi = -1;
			var close = -1;
			while (k < n) {
				if (src[k] === "/" && src[k + 1] === "*") {
					var ce = src.indexOf("*/", k + 2);
					k = ce === -1 ? n : ce + 2;
					continue;
				}
				if (src[k] === '"' || src[k] === "'") {
					var q = src[k];
					k++;
					while (k < n && src[k] !== q) {
						if (src[k] === "\\") k++;
						k++;
					}
					k++;
					continue;
				}
				if (src[k] === "(") {
					var depth = 1;
					k++;
					while (k < n && depth > 0) {
						if (src[k] === "(") depth++;
						else if (src[k] === ")") depth--;
						k++;
					}
					continue;
				}
				if (src[k] === "{") {
					brace = k;
					break;
				}
				if (src[k] === ";") {
					semi = k;
					break;
				}
				if (src[k] === "}") {
					close = k;
					break;
				}
				k++;
			}

			if (brace !== -1 && (semi === -1 || brace < semi)) {
				push("t-sel", src.slice(i, brace).replace(/\s+$/, ""));
				var trail = src.slice(i, brace).match(/\s+$/);
				if (trail) push("", trail[0]);
				push("t-punct", "{");
				i = brace + 1;
				inBlock++;
				continue;
			}

			/* Deklaration: property : value ; */
			var stop = semi !== -1 ? semi : close !== -1 ? close : n;
			var decl = src.slice(i, stop);
			var colon = decl.indexOf(":");
			if (colon !== -1 && inBlock > 0) {
				push("t-prop", decl.slice(0, colon));
				push("t-punct", ":");
				pushValue(decl.slice(colon + 1));
			} else {
				push("", decl);
			}
			if (semi !== -1) push("t-punct", ";");
			i = semi !== -1 ? semi + 1 : stop;
		}

		function pushValue(v) {
			var re = /("[^"]*"|'[^']*'|-?\d+(?:\.\d+)?[a-z%]*)/g;
			var last = 0;
			var m;
			while ((m = re.exec(v))) {
				if (m.index > last) push("", v.slice(last, m.index));
				push(m[1][0] === '"' || m[1][0] === "'" ? "t-str" : "t-num", m[1]);
				last = m.index + m[1].length;
			}
			if (last < v.length) push("", v.slice(last));
		}

		return out;
	}

	/* Tokenisiert HTML. <style>-Inhalte werden als CSS weiterverarbeitet. */
	function tokenizeHTML(src) {
		var out = [];
		var i = 0;
		var n = src.length;

		function push(cls, text) {
			if (text) out.push([cls, text]);
		}

		while (i < n) {
			if (src[i] !== "<") {
				var next = src.indexOf("<", i);
				if (next === -1) next = n;
				push("", src.slice(i, next));
				i = next;
				continue;
			}

			if (src.startsWith("<!--", i)) {
				var end = src.indexOf("-->", i + 4);
				end = end === -1 ? n : end + 3;
				push("t-com", src.slice(i, end));
				i = end;
				continue;
			}

			if (src[i + 1] === "!" || src[i + 1] === "?") {
				var gt = src.indexOf(">", i);
				gt = gt === -1 ? n : gt + 1;
				push("t-tag", src.slice(i, gt));
				i = gt;
				continue;
			}

			if (!/[A-Za-z\/]/.test(src[i + 1] || "")) {
				push("", "<");
				i++;
				continue;
			}

			/* Tag zerlegen */
			var closing = src[i + 1] === "/";
			push("t-punct", closing ? "</" : "<");
			i += closing ? 2 : 1;

			var ns = i;
			while (i < n && isIdent(src[i])) i++;
			var name = src.slice(ns, i).toLowerCase();
			push("t-tag", src.slice(ns, i));

			var selfClosed = false;
			while (i < n && src[i] !== ">") {
				if (WS.test(src[i])) {
					var we = i;
					while (we < n && WS.test(src[we])) we++;
					push("", src.slice(i, we));
					i = we;
					continue;
				}
				if (src[i] === "/") {
					selfClosed = true;
					push("t-punct", "/");
					i++;
					continue;
				}
				if (src[i] === "=") {
					push("t-punct", "=");
					i++;
					if (src[i] === '"' || src[i] === "'") {
						var q = src[i];
						var qe = src.indexOf(q, i + 1);
						qe = qe === -1 ? n : qe + 1;
						push("t-str", src.slice(i, qe));
						i = qe;
					} else {
						var ue = i;
						while (ue < n && !WS.test(src[ue]) && src[ue] !== ">") ue++;
						push("t-str", src.slice(i, ue));
						i = ue;
					}
					continue;
				}
				var ae = i;
				while (ae < n && !WS.test(src[ae]) && src[ae] !== "=" && src[ae] !== ">")
					ae++;
				push("t-attr", src.slice(i, ae));
				i = ae;
			}
			if (i < n) {
				push("t-punct", ">");
				i++;
			}

			/* Rohtext-Elemente */
			if (!closing && !selfClosed && (name === "style" || name === "script")) {
				var closeTag = "</" + name;
				var ce = src.toLowerCase().indexOf(closeTag, i);
				if (ce === -1) ce = n;
				var raw = src.slice(i, ce);
				if (name === "style") {
					out = out.concat(tokenizeCSS(raw));
				} else {
					push("", raw);
				}
				i = ce;
			}
		}

		return out;
	}

	/* Baut aus Tokens Zeilen-HTML. Keine Span kreuzt einen Zeilenumbruch, damit
	   Zeilennummern und Hervorhebungen funktionieren. */
	function tokensToLines(tokens) {
		var lines = [""];

		tokens.forEach(function (tok) {
			var cls = tok[0];
			var parts = tok[1].split("\n");
			parts.forEach(function (part, idx) {
				if (idx > 0) lines.push("");
				if (!part) return;
				var html = esc(part);
				lines[lines.length - 1] += cls
					? '<span class="' + cls + '">' + html + "</span>"
					: html;
			});
		});

		return lines;
	}

	function parseRanges(spec) {
		var set = {};
		if (!spec) return set;
		spec.split(",").forEach(function (part) {
			var m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
			if (!m) return;
			var a = +m[1];
			var b = m[2] ? +m[2] : a;
			for (var i = a; i <= b; i++) set[i] = true;
		});
		return set;
	}

	function highlight(code, lang) {
		var tokens = lang === "css" ? tokenizeCSS(code) : tokenizeHTML(code);
		return tokensToLines(tokens);
	}

	function langOf(el, file) {
		if (el.dataset.lang) return el.dataset.lang;
		if (file && /\.css$/.test(file)) return "css";
		return "html";
	}

	function fileContent(key) {
		var files = window.EXAMPLES || {};
		if (key in files) return files[key];
		return null;
	}

	/* ------------------------------------------------------------- Listings */

	function renderListing(pre) {
		var file = pre.dataset.src;
		var code;

		if (file) {
			code = fileContent(file);
			if (code === null) {
				pre.innerHTML =
					'<code class="t-com">/* Datei ' +
					esc(file) +
					" fehlt. Bitte python3 web/build.py ausfuehren. */</code>";
				return;
			}
		} else {
			code = pre.textContent;
		}

		code = code.replace(/\n+$/, "");

		var first = 1;
		var last = Infinity;
		if (pre.dataset.lines) {
			var m = pre.dataset.lines.match(/^(\d+)(?:-(\d+))?$/);
			if (m) {
				first = +m[1];
				last = m[2] ? +m[2] : first;
			}
		}

		var lines = highlight(code, langOf(pre, file));
		var hl = parseRanges(pre.dataset.hl);
		var showNos = pre.hasAttribute("data-linenos");

		var slice = lines.slice(first - 1, last === Infinity ? undefined : last);

		/* Gemeinsame Einrueckung eines Ausschnitts entfernen. */
		if (first > 1 || last !== Infinity) {
			var indents = slice
				.filter(function (l) {
					return l.replace(/<[^>]*>/g, "").trim() !== "";
				})
				.map(function (l) {
					var plain = l.replace(/<[^>]*>/g, "");
					var mm = plain.match(/^[ \t]*/);
					return mm ? mm[0].length : 0;
				});
			var minIndent = indents.length ? Math.min.apply(null, indents) : 0;
			if (minIndent > 0) {
				slice = slice.map(function (l) {
					var removed = 0;
					return l.replace(/^([ \t]|<[^>]*>)*/, function (m0) {
						var out = "";
						for (var i = 0; i < m0.length; i++) {
							if (m0[i] === "<") {
								var gt = m0.indexOf(">", i);
								out += m0.slice(i, gt + 1);
								i = gt;
							} else if (removed < minIndent) {
								removed++;
							} else {
								out += m0[i];
							}
						}
						return out;
					});
				});
			}
		}

		var body = slice
			.map(function (line, idx) {
				var no = first + idx;
				var classes = [];
				if (showNos) classes.push("ln");
				if (hl[no]) classes.push("hl");
				if (!classes.length) return line || "";
				return (
					'<span class="' + classes.join(" ") + '">' + (line || " ") + "</span>"
				);
			})
			.join(showNos ? "" : "\n");

		if (showNos) pre.classList.add("linenos");
		if (showNos && first > 1) pre.style.counterReset = "ln " + (first - 1);
		pre.innerHTML = "<code>" + body + "</code>";
	}

	/* -------------------------------------------------- Dokument zusammenbauen */

	var SKELETON_HEAD =
		'<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n' +
		'<meta name="viewport" content="width=device-width">\n';

	function composeDocument(html, css) {
		var doc = html || "";
		var hasShell = /<html[\s>]/i.test(doc) || /<body[\s>]/i.test(doc);

		if (!hasShell) {
			doc = SKELETON_HEAD + "</head>\n<body>\n" + doc + "\n</body>\n</html>";
		}

		var injected = false;
		var styleTag = css ? "<style>\n" + css + "\n</style>" : "";

		/* Lokale <link rel="stylesheet"> durch den Inhalt des CSS-Reiters ersetzen. */
		doc = doc.replace(
			/<link\b[^>]*>/gi,
			function (tag) {
				if (!/stylesheet/i.test(tag)) return tag;
				var href = tag.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
				var url = href ? href[2] || href[3] || href[4] || "" : "";
				if (/^[a-z]+:\/\//i.test(url) || url.indexOf("//") === 0) return tag;
				if (injected) return "";
				injected = true;
				return styleTag;
			}
		);

		if (css && !injected) {
			if (/<\/head>/i.test(doc)) {
				doc = doc.replace(/<\/head>/i, styleTag + "\n</head>");
			} else if (/<body[^>]*>/i.test(doc)) {
				doc = doc.replace(/<body[^>]*>/i, function (m) {
					return m + "\n" + styleTag;
				});
			} else {
				doc = styleTag + doc;
			}
		}

		/* Links aus der Vorschau in einem neuen Tab oeffnen. */
		var base = '<base target="_blank">';
		if (/<head[^>]*>/i.test(doc)) {
			doc = doc.replace(/<head[^>]*>/i, function (m) {
				return m + base;
			});
		} else {
			doc = base + doc;
		}

		return doc;
	}

	/* ------------------------------------------------------- Live-Vorschauen */

	function excerpt(text, spec) {
		var m = spec.match(/^(\d+)(?:-(\d+))?$/);
		if (!m) return text;
		var lines = text.split("\n");
		var a = +m[1];
		var b = m[2] ? +m[2] : a;
		return lines.slice(a - 1, b).join("\n");
	}

	function renderDemo(frame) {
		var html = frame.dataset.src ? fileContent(frame.dataset.src) : "";
		var css = frame.dataset.css ? fileContent(frame.dataset.css) : "";
		if (html === null) html = "";
		if (css === null) css = "";
		if (/\.svg$/.test(frame.dataset.src || "")) css = SVG_DEMO_CSS + css;
		/* Nur einen Ausschnitt darstellen, passend zum Listing daneben. */
		if (frame.dataset.lines) html = excerpt(html, frame.dataset.lines);
		frame.setAttribute(
			"sandbox",
			"allow-scripts allow-popups allow-popups-to-escape-sandbox"
		);
		frame.setAttribute("loading", "lazy");
		if (frame.dataset.height) frame.style.height = frame.dataset.height + "px";
		frame.srcdoc = composeDocument(html, css);
	}

	/* ----------------------------------------------------- Uebungen, Fortschritt */

	function setupExercises() {
		var main = document.querySelector("main");
		if (!main) return [];

		var offset = +(main.dataset.exOffset || 0);
		/* Kapitelnummer im Skript; die Nummern lauten darum 5.01, 5.02, … wie
		   dort (\thechapter.NN). */
		var chapter = main.dataset.exChapter || "5";
		var list = Array.prototype.slice.call(
			document.querySelectorAll(".exercise")
		);

		list.forEach(function (ex, idx) {
			var count = offset + idx + 1;
			var no = chapter + "." + (count < 10 ? "0" + count : count);
			var id = ex.id || "ex" + count;
			ex.id = id;
			var doneKey = "done." + PAGE + "." + id;

			var head = document.createElement("div");
			head.className = "exercise__head";

			var label = document.createElement("span");
			label.className = "exercise__no";
			label.textContent = "Übung " + no;
			head.appendChild(label);

			if (ex.dataset.tag) {
				var tag = document.createElement("span");
				tag.className = "exercise__tag";
				tag.textContent = ex.dataset.tag;
				head.appendChild(tag);
			}

			var wrap = document.createElement("label");
			wrap.className = "exercise__done";
			var box = document.createElement("input");
			box.type = "checkbox";
			box.checked = store.get(doneKey) === "1";
			wrap.appendChild(box);
			wrap.appendChild(document.createTextNode("erledigt"));
			head.appendChild(wrap);

			ex.dataset.done = box.checked ? "1" : "0";
			box.addEventListener("change", function () {
				ex.dataset.done = box.checked ? "1" : "0";
				if (box.checked) store.set(doneKey, "1");
				else store.del(doneKey);
				updateProgress(list);
			});

			ex.insertBefore(head, ex.firstChild);
			ex.dataset.exNo = no;
			ex.dataset.storeKey = PAGE + "." + id;
		});

		return list;
	}

	function updateProgress(list) {
		var bar = document.querySelector("[data-progress]");
		if (!bar) return;
		var done = list.filter(function (ex) {
			return ex.dataset.done === "1";
		}).length;
		var pct = list.length ? Math.round((done / list.length) * 100) : 0;
		bar.querySelector(".meter > i").style.width = pct + "%";
		bar.querySelector("[data-progress-text]").textContent =
			done + " von " + list.length + " Übungen erledigt";
	}

	function setupProgress(list) {
		var bar = document.querySelector("[data-progress]");
		if (!bar || !list.length) return;
		updateProgress(list);

		var reset = bar.querySelector("[data-reset]");
		if (reset) {
			reset.addEventListener("click", function () {
				if (
					!confirm(
						"Alle Häkchen und allen eigenen Code auf dieser Seite löschen?"
					)
				)
					return;
				store.keys().forEach(function (k) {
					if (
						k.indexOf("done." + PAGE + ".") === 0 ||
						k.indexOf("code." + PAGE + ".") === 0
					)
						store.del(k);
				});
				location.reload();
			});
		}
	}

	/* --------------------------------------------------- Startseiten-Karten */

	function setupCards() {
		document.querySelectorAll("[data-page][data-total]").forEach(function (card) {
			var page = card.dataset.page;
			var total = +card.dataset.total;
			var done = store.keys().filter(function (k) {
				return k.indexOf("done." + page + ".") === 0;
			}).length;
			var pct = total ? Math.round((Math.min(done, total) / total) * 100) : 0;
			var meter = card.querySelector(".meter > i");
			var text = card.querySelector("[data-count]");
			if (meter) meter.style.width = pct + "%";
			if (text) text.textContent = done + " / " + total + " Übungen erledigt";
		});
	}

	/* ------------------------------------------------ Inhaltsverzeichnis */

	function setupMinitoc() {
		var toc = document.querySelector(".minitoc ol");
		if (!toc) return;

		var heads = document.querySelectorAll(
			".content h2[id], .content h3[id]"
		);
		if (!heads.length) return;

		heads.forEach(function (h) {
			var li = document.createElement("li");
			if (h.tagName === "H3") li.className = "sub";
			var a = document.createElement("a");
			a.href = "#" + h.id;
			a.textContent = h.dataset.short || h.textContent;
			li.appendChild(a);
			toc.appendChild(li);
		});

		var links = toc.querySelectorAll("a");

		if (!("IntersectionObserver" in window)) return;
		var seen = {};
		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (e) {
					seen[e.target.id] = e.isIntersecting;
				});
				var current = null;
				heads.forEach(function (h) {
					if (seen[h.id] && !current) current = h.id;
				});
				links.forEach(function (a) {
					a.classList.toggle(
						"active",
						current !== null && a.hash === "#" + current
					);
				});
			},
			{ rootMargin: "-70px 0px -70% 0px" }
		);
		heads.forEach(function (h) {
			observer.observe(h);
		});
	}

	/* --------------------------------------------------------- Loesungen */

	/* Ohne Schalter kommen die Loesungsboxen gar nicht in den DOM. Laeuft als
	   erstes in init(), damit sie beim Laden nicht kurz aufblitzen. */
	function setupSolutions() {
		if (SHOW_SOL) {
			document.documentElement.dataset.loesungen = "1";
			return;
		}
		document.querySelectorAll("details.sol").forEach(function (d) {
			d.remove();
		});
	}

	/* --------------------------------------------------------- Farbschema */

	/* Dunkel ist der Standard (siehe style.css); nur "light" weicht davon ab.
	   Das Attribut setzt schon ein kleines Skript im <head> jeder Seite, damit
	   beim Laden nichts aufblitzt -- hier nur noch der Umschalter. */
	function setupTheme() {
		var root = document.documentElement;
		var saved = store.get("theme");
		if (saved === "light" || saved === "dark") root.dataset.theme = saved;

		var btn = document.querySelector(".themetoggle");
		if (!btn) return;

		function isDark() {
			return root.dataset.theme !== "light";
		}

		function label() {
			btn.textContent = isDark() ? "☀" : "☾";
			btn.setAttribute(
				"aria-label",
				isDark() ? "Helles Farbschema" : "Dunkles Farbschema"
			);
		}

		label();
		btn.addEventListener("click", function () {
			var next = isDark() ? "light" : "dark";
			root.dataset.theme = next;
			store.set("theme", next);
			label();
		});
	}

	/* -------------------------------------------------------- Navigation */

	function setupNav() {
		document.querySelectorAll(".topbar nav a").forEach(function (a) {
			var href = a.getAttribute("href");
			if (href === PAGE) a.setAttribute("aria-current", "page");
		});
	}

	/* -------------------------------------------------------------- Start */

	function init() {
		setupSolutions();
		setupTheme();
		setupNav();
		document.querySelectorAll("figure.listing pre").forEach(renderListing);
		document.querySelectorAll(".demo iframe").forEach(renderDemo);
		var list = setupExercises();
		setupProgress(list);
		setupCards();
		setupMinitoc();
		if (window.Workbench) window.Workbench.initAll(PAGE, store, composeDocument);
	}

	window.SITE = {
		store: store,
		composeDocument: composeDocument,
		fileContent: fileContent,
		highlight: highlight,
		svgDemoCSS: SVG_DEMO_CSS,
		showSolutions: SHOW_SOL,
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
