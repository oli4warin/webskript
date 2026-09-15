/* ==========================================================================
   Werkbank: Editor mit Reitern (html/css/svg, je nach data-files) und
   Live-Vorschau. Der Code der Schueler wird im Browser (localStorage)
   gespeichert.

   Eine SVG-Datei ist kein ganzes HTML-Dokument; sie wird darum in den <body>
   der Vorschau gestellt (siehe composeDocument in site.js) und dort
   zentriert.
   ========================================================================== */

(function () {
	"use strict";

	var SKELETON_PLAIN =
		"<!doctype html>\n" +
		"<html>\n" +
		"  <head>\n" +
		'    <meta charset="utf-8" />\n' +
		'    <meta name="viewport" content="width=device-width" />\n' +
		"    <title>Meine Seite</title>\n" +
		"  </head>\n" +
		"\n" +
		"  <body>\n" +
		"    <h1>Titel</h1>\n" +
		"  </body>\n" +
		"</html>\n";

	var SKELETON_LINKED =
		"<!doctype html>\n" +
		"<html>\n" +
		"  <head>\n" +
		'    <meta charset="utf-8" />\n' +
		'    <meta name="viewport" content="width=device-width" />\n' +
		'    <link rel="stylesheet" href="style.css" />\n' +
		"    <title>Meine Seite</title>\n" +
		"  </head>\n" +
		"\n" +
		"  <body>\n" +
		"    <h1>Titel</h1>\n" +
		"  </body>\n" +
		"</html>\n";

	var SKELETON_CSS = "/* Ihre CSS-Regeln */\n";

	var SKELETON_SVG =
		'<svg viewBox="0 0 100 100">\n' +
		'  <circle cx="50" cy="50" r="40" fill="red" />\n' +
		"</svg>\n";

	/* ------------------------------------------------------------------
	   Emmet-Kürzel (HTML- und SVG-Reiter). Kein fertiges Emmet eingebunden --
	   die Seite muss auch offline über file:// laufen (siehe README).
	   Stattdessen ein kleiner, in sich geschlossener Ausdrucksparser für den
	   gängigen Teilumfang: Tag, .klasse, #id, [attr=wert], {text}, *anzahl
	   (mit $ als Zähler), Kind (>), Geschwister (+), Klammerung (()) und ein
	   Schritt Hochklettern (^). Wird auf Tab angewendet; HTML- und
	   SVG-Reiter haben je ein eigenes "Profil" (Tag-Liste, leere Elemente,
	   Standardattribute), der Parser selbst ist für beide derselbe.
	   ------------------------------------------------------------------ */

	function tagSet(list) {
		return list.split(" ").reduce(function (set, t) {
			set[t] = true;
			return set;
		}, {});
	}

	var EMMET_IMPLICIT_TAG = {
		ul: "li", ol: "li",
		table: "tr", tbody: "tr", thead: "tr", tfoot: "tr",
		tr: "td",
		select: "option", optgroup: "option",
		dl: "dt",
		text: "tspan",
	};

	var EMMET_PROFILE_HTML = {
		fallbackTag: "div",
		voidTags: tagSet(
			"area base br col embed hr img input link meta param source track wbr"
		),
		defaultAttrs: {
			a: [["href", ""]],
			img: [["src", ""], ["alt", ""]],
			input: [["type", "text"]],
			link: [["rel", "stylesheet"], ["href", ""]],
		},
		knownTags: tagSet(
			"a abbr address area article aside audio b bdi bdo blockquote body br " +
			"button canvas caption cite code col colgroup data datalist dd del " +
			"details dfn dialog div dl dt em embed fieldset figcaption figure " +
			"footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input " +
			"ins kbd label legend li link main map mark meta meter nav noscript " +
			"object ol optgroup option output p param picture pre progress q rp rt " +
			"ruby s samp script section select small source span strong style sub " +
			"summary sup table tbody td template textarea tfoot th thead time " +
			"title tr track u ul var video wbr"
		),
	};

	var EMMET_PROFILE_SVG = {
		fallbackTag: "g",
		voidTags: tagSet(
			"circle ellipse line rect path polygon polyline stop use image view " +
			"animate animateMotion animateTransform set mpath feGaussianBlur " +
			"feOffset feBlend feColorMatrix feComposite feDropShadow feFlood " +
			"feImage feTile feTurbulence feDisplacementMap"
		),
		defaultAttrs: {
			circle: [["cx", "0"], ["cy", "0"], ["r", "0"]],
			ellipse: [["cx", "0"], ["cy", "0"], ["rx", "0"], ["ry", "0"]],
			rect: [["width", "0"], ["height", "0"]],
			line: [["x1", "0"], ["y1", "0"], ["x2", "0"], ["y2", "0"]],
			path: [["d", ""]],
			polygon: [["points", ""]],
			polyline: [["points", ""]],
			use: [["href", ""]],
			stop: [["offset", "0"], ["stop-color", "#000"]],
		},
		knownTags: tagSet(
			"a animate animateMotion animateTransform circle clipPath defs desc " +
			"ellipse feBlend feColorMatrix feComposite feDropShadow feFlood " +
			"feGaussianBlur feImage feMerge feMergeNode feOffset feTile " +
			"feTurbulence feDisplacementMap filter foreignObject g image line " +
			"linearGradient marker mask metadata mpath path pattern polygon " +
			"polyline radialGradient rect set stop style svg switch symbol text " +
			"textPath title tspan use view"
		),
	};

	var EMMET_CHAR = /[A-Za-z0-9.#\-_:*+^>()[\]="'$\{\}]/;
	var EMMET_SPECIAL = /[.#[{>+*^($]/;

	function emmetParse(input) {
		var i = 0;
		var n = input.length;

		function peek() {
			return input[i];
		}
		function eof() {
			return i >= n;
		}

		function parseAttrs(node) {
			for (;;) {
				if (peek() === ".") {
					i++;
					var cm = /^[A-Za-z0-9_$-]+/.exec(input.slice(i));
					if (!cm) break;
					node.classes.push(cm[0]);
					i += cm[0].length;
				} else if (peek() === "#") {
					i++;
					var idm = /^[A-Za-z0-9_$-]+/.exec(input.slice(i));
					if (!idm) break;
					node.id = idm[0];
					i += idm[0].length;
				} else if (peek() === "[") {
					i++;
					while (!eof() && peek() !== "]") {
						while (peek() === " ") i++;
						if (eof() || peek() === "]") break;
						var am = /^[A-Za-z_:][A-Za-z0-9_:.-]*/.exec(input.slice(i));
						if (!am) {
							i++;
							continue;
						}
						var aname = am[0];
						i += am[0].length;
						var aval = null;
						if (peek() === "=") {
							i++;
							if (peek() === '"' || peek() === "'") {
								var q = peek();
								i++;
								var vs = i;
								while (!eof() && peek() !== q) i++;
								aval = input.slice(vs, i);
								if (peek() === q) i++;
							} else {
								var vm = /^[^\s\]]*/.exec(input.slice(i));
								aval = vm[0];
								i += vm[0].length;
							}
						}
						node.attrs.push([aname, aval]);
						while (peek() === " ") i++;
					}
					if (peek() === "]") i++;
				} else if (peek() === "{") {
					i++;
					var ts = i;
					while (!eof() && peek() !== "}") i++;
					node.text = input.slice(ts, i);
					if (peek() === "}") i++;
				} else {
					break;
				}
			}
		}

		function parseNode() {
			var tm = /^[A-Za-z][A-Za-z0-9:-]*/.exec(input.slice(i));
			var node = {
				tag: null, isGroup: false, classes: [], id: null,
				attrs: [], text: null, children: [], mult: 1,
			};
			if (tm) {
				node.tag = tm[0];
				i += tm[0].length;
			}
			parseAttrs(node);
			if (
				!node.tag && !node.classes.length && !node.id &&
				!node.attrs.length && node.text == null
			) {
				return null;
			}
			return node;
		}

		function parseMult(node) {
			if (peek() === "*") {
				i++;
				var mm = /^[0-9]+/.exec(input.slice(i));
				if (mm) {
					node.mult = parseInt(mm[0], 10);
					i += mm[0].length;
				}
			}
		}

		function parseElement() {
			var node;
			if (peek() === "(") {
				i++;
				node = {
					tag: null, isGroup: true, classes: [], id: null,
					attrs: [], text: null, children: [], mult: 1,
				};
				node.children = parseSequence();
				if (peek() === ")") i++;
			} else {
				node = parseNode();
			}
			if (!node) return null;
			parseMult(node);
			return node;
		}

		function parseSequence() {
			var siblings = [];
			for (;;) {
				if (eof() || peek() === ")") break;
				if (peek() === "+") {
					i++;
					continue;
				}
				if (peek() === "^") {
					while (peek() === "^") i++;
					break;
				}
				if (peek() === ">") {
					i++;
					if (siblings.length) {
						var parent = siblings[siblings.length - 1];
						parent.children = parent.children.concat(parseSequence());
					}
					continue;
				}
				var node = parseElement();
				if (!node) break;
				siblings.push(node);
			}
			return siblings;
		}

		var nodes = parseSequence();
		return { nodes: nodes, pos: i };
	}

	function emmetNumber(str, idx) {
		return str.replace(/\$+/g, function (m) {
			var s = String(idx);
			while (s.length < m.length) s = "0" + s;
			return s;
		});
	}

	/* Reine Strukturkopie, ohne $ aufzulösen -- für Kinder, die selbst eine
	   *anzahl tragen: deren $ gehört zu ihrem EIGENEN Durchlauf, nicht zum
	   Index des Vorfahren. */
	function emmetCopyRaw(node) {
		return {
			tag: node.tag,
			isGroup: node.isGroup,
			classes: node.classes.slice(),
			id: node.id,
			attrs: node.attrs.map(function (a) {
				return a.slice();
			}),
			text: node.text,
			mult: node.mult,
			children: node.children.map(emmetCopyRaw),
		};
	}

	function emmetCloneNumbered(node, idx) {
		return {
			tag: node.tag,
			isGroup: node.isGroup,
			classes: node.classes.map(function (c) {
				return emmetNumber(c, idx);
			}),
			id: node.id != null ? emmetNumber(node.id, idx) : null,
			attrs: node.attrs.map(function (a) {
				return [a[0], a[1] != null ? emmetNumber(a[1], idx) : a[1]];
			}),
			text: node.text != null ? emmetNumber(node.text, idx) : null,
			mult: node.mult,
			children: node.children.map(function (c) {
				return c.mult > 1 ? emmetCopyRaw(c) : emmetCloneNumbered(c, idx);
			}),
		};
	}

	function emmetExpandList(nodes, parentTag, profile) {
		var out = [];
		nodes.forEach(function (node) {
			var count = node.mult || 1;
			for (var idx = 1; idx <= count; idx++) {
				var inst = emmetCloneNumbered(node, idx);
				if (inst.isGroup) {
					out = out.concat(emmetExpandList(inst.children, parentTag, profile));
				} else {
					if (!inst.tag)
						inst.tag = EMMET_IMPLICIT_TAG[parentTag] || profile.fallbackTag;
					inst.children = emmetExpandList(inst.children, inst.tag, profile);
					out.push(inst);
				}
			}
		});
		return out;
	}

	function emmetEsc(s) {
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function emmetRenderNode(node, indent, state, profile) {
		var attrs = node.attrs.slice();
		var defaults = profile.defaultAttrs[node.tag];
		if (defaults) {
			defaults.forEach(function (d) {
				if (!attrs.some(function (a) { return a[0] === d[0]; })) attrs.push(d.slice());
			});
		}

		var attrStr = "";
		if (node.id) attrStr += ' id="' + emmetEsc(node.id) + '"';
		if (node.classes.length) attrStr += ' class="' + emmetEsc(node.classes.join(" ")) + '"';
		attrs.forEach(function (a) {
			attrStr += a[1] == null ? " " + a[0] : " " + a[0] + '="' + emmetEsc(a[1]) + '"';
		});

		if (profile.voidTags[node.tag]) {
			state.out += indent + "<" + node.tag + attrStr + " />\n";
			return;
		}

		var hasChildren = node.children.length > 0;
		if (!hasChildren && node.text == null) {
			state.out += indent + "<" + node.tag + attrStr + ">";
			if (state.cursorPos === -1) state.cursorPos = state.out.length;
			state.out += "</" + node.tag + ">\n";
			return;
		}
		if (!hasChildren) {
			state.out +=
				indent + "<" + node.tag + attrStr + ">" +
				emmetEsc(node.text) + "</" + node.tag + ">\n";
			return;
		}

		state.out += indent + "<" + node.tag + attrStr + ">\n";
		node.children.forEach(function (ch) {
			emmetRenderNode(ch, indent + "  ", state, profile);
		});
		if (node.text != null) state.out += indent + "  " + emmetEsc(node.text) + "\n";
		state.out += indent + "</" + node.tag + ">\n";
	}

	function emmetRenderTree(nodes, profile) {
		var state = { out: "", cursorPos: -1 };
		nodes.forEach(function (n) {
			emmetRenderNode(n, "", state, profile);
		});
		var text = state.out;
		if (text.slice(-1) === "\n") text = text.slice(0, -1);
		var cursorPos = state.cursorPos === -1 ? text.length : Math.min(state.cursorPos, text.length);
		return { text: text, cursorPos: cursorPos };
	}

	function emmetExpand(abbr, profile) {
		try {
			var parsed = emmetParse(abbr);
			if (parsed.pos < abbr.length || !parsed.nodes.length) return null;
			var expanded = emmetExpandList(parsed.nodes, null, profile);
			if (!expanded.length) return null;
			return emmetRenderTree(expanded, profile);
		} catch (e) {
			return null;
		}
	}

	function emmetApplyBaseIndent(text, cursorPos, baseIndent) {
		if (!baseIndent) return { text: text, cursorPos: cursorPos };
		var breaksBefore = (text.slice(0, cursorPos).match(/\n/g) || []).length;
		var indented = text
			.split("\n")
			.map(function (line, idx) {
				return idx === 0 ? line : baseIndent + line;
			})
			.join("\n");
		return { text: indented, cursorPos: cursorPos + baseIndent.length * breaksBefore };
	}

	/* Versucht, das Kürzel vor dem Cursor zu expandieren. Gibt true zurück,
	   wenn der Textinhalt des Feldes verändert wurde (dann muss der Aufrufer
	   touched() aufrufen), sonst false -- dann greift der normale Tab. */
	function tryExpandEmmet(code, profile) {
		if (code.selectionStart !== code.selectionEnd) return false;
		var value = code.value;
		var pos = code.selectionStart;
		var lineStart = value.lastIndexOf("\n", pos - 1) + 1;

		var k = pos;
		while (k > lineStart && EMMET_CHAR.test(value[k - 1])) k--;
		var abbr = value.slice(k, pos);
		if (!abbr) return false;
		/* Wird bereits mitten in einem Tag getippt (nach "<"), nicht
		   eingreifen -- sonst verdoppelt sich die spitze Klammer. */
		if (k > 0 && value[k - 1] === "<") return false;

		var plainWord = /^[A-Za-z][A-Za-z0-9]*$/.test(abbr);
		if (plainWord) {
			/* Groß-/Kleinschreibung bleibt erhalten (wichtig für SVG-Tags wie
			   linearGradient), die Bekanntheitsprüfung nimmt notfalls auch
			   Kleinschreibung -- so tippt sich z. B. "div" weiterhin bequem. */
			if (!profile.knownTags[abbr] && !profile.knownTags[abbr.toLowerCase()])
				return false;
		} else if (!EMMET_SPECIAL.test(abbr)) {
			return false;
		}

		var result = emmetExpand(abbr, profile);
		if (!result) return false;

		var baseIndent = (/^[ \t]*/.exec(value.slice(lineStart)) || [""])[0];
		var adjusted = emmetApplyBaseIndent(result.text, result.cursorPos, baseIndent);

		code.value = value.slice(0, k) + adjusted.text + value.slice(pos);
		code.selectionStart = code.selectionEnd = k + adjusted.cursorPos;
		return true;
	}

	function el(tag, cls, text) {
		var node = document.createElement(tag);
		if (cls) node.className = cls;
		if (text != null) node.textContent = text;
		return node;
	}

	function download(name, content) {
		var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
		var url = URL.createObjectURL(blob);
		var a = document.createElement("a");
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(function () {
			URL.revokeObjectURL(url);
		}, 1000);
	}

	function build(root, page, store, compose) {
		var id = root.dataset.id || "wb";
		var names = (root.dataset.files || "svg").split(",").map(function (s) {
			return s.trim();
		});
		var wantsCSS = names.indexOf("css") !== -1;
		var wantsSVG = names.indexOf("svg") !== -1;

		/* Startcode: aus dem Submodul (data-seed-*) oder als <template
		   data-seed="html|css"> im Element selbst. */
		function templateSeed(which) {
			var tpl = root.querySelector('template[data-seed="' + which + '"]');
			if (!tpl) return null;
			/* Ein <textarea> dekodiert Entities zuverlaessig (RCDATA-Inhalt). */
			var decoder = document.createElement("textarea");
			decoder.innerHTML = tpl.innerHTML;
			return decoder.value.replace(/^\n/, "").replace(/\s+$/, "\n");
		}

		var seeds = {
			html: root.dataset.seedHtml
				? window.SITE.fileContent(root.dataset.seedHtml)
				: templateSeed("html"),
			css: root.dataset.seedCss
				? window.SITE.fileContent(root.dataset.seedCss)
				: templateSeed("css"),
			svg: root.dataset.seedSvg
				? window.SITE.fileContent(root.dataset.seedSvg)
				: templateSeed("svg"),
		};
		if (seeds.html == null)
			seeds.html = wantsCSS ? SKELETON_LINKED : SKELETON_PLAIN;
		if (seeds.css == null) seeds.css = SKELETON_CSS;
		if (seeds.svg == null) seeds.svg = SKELETON_SVG;

		root.querySelectorAll("template[data-seed]").forEach(function (t) {
			t.remove();
		});

		var solutions = {
			html: root.dataset.solHtml
				? window.SITE.fileContent(root.dataset.solHtml)
				: null,
			css: root.dataset.solCss
				? window.SITE.fileContent(root.dataset.solCss)
				: null,
			svg: root.dataset.solSvg
				? window.SITE.fileContent(root.dataset.solSvg)
				: null,
		};
		/* Der Knopf «Loesung laden» erscheint nur, wenn die Loesungen
		   eingeschaltet sind (?loesungen=1, siehe site.js). */
		var hasSolution =
			window.SITE.showSolutions &&
			names.some(function (which) {
				return solutions[which] != null;
			});

		var fileLabel = { html: "index.html", css: "style.css", svg: "bild.svg" };
		var storeKey = function (which) {
			return "code." + page + "." + id + "." + which;
		};

		var buffers = {};
		names.forEach(function (which) {
			var saved = store.get(storeKey(which));
			buffers[which] = saved != null ? saved : seeds[which];
		});

		var active = names[0];

		/* ------------------------------------------------------------ Aufbau */

		var bar = el("div", "wb__bar");
		var tabs = el("div", "wb__tabs");
		var tabBtns = {};

		names.forEach(function (which) {
			var b = el("button", "wb__tab", fileLabel[which]);
			b.type = "button";
			b.setAttribute("role", "tab");
			b.addEventListener("click", function () {
				select(which);
			});
			tabBtns[which] = b;
			tabs.appendChild(b);
		});

		if (names.length > 1) {
			tabs.setAttribute("role", "tablist");
			bar.appendChild(tabs);
		} else {
			var single = el("span", "wb__tab", fileLabel[active]);
			single.setAttribute("aria-selected", "true");
			bar.appendChild(single);
		}

		var actions = el("div", "wb__actions");
		bar.appendChild(actions);

		function addBtn(label, cls, title, fn) {
			var b = el("button", "wb__btn" + (cls ? " " + cls : ""), label);
			b.type = "button";
			if (title) b.title = title;
			b.addEventListener("click", fn);
			actions.appendChild(b);
			return b;
		}

		var panes = el("div", "wb__panes");
		var editorPane = el("div", "wb__editor");
		var gutter = el("div", "wb__gutter");
		gutter.setAttribute("aria-hidden", "true");

		/* Eingefaerbter Code hinter dem Textfeld; siehe .wb__stack in style.css. */
		var stack = el("div", "wb__stack");
		var layer = el("pre", "wb__hl");
		layer.setAttribute("aria-hidden", "true");
		var layerCode = el("code");
		layer.appendChild(layerCode);

		var code = el("textarea", "wb__code");
		code.spellcheck = false;
		code.setAttribute("autocapitalize", "off");
		code.setAttribute("autocomplete", "off");
		code.setAttribute("aria-label", "Code-Editor");

		stack.appendChild(layer);
		stack.appendChild(code);
		editorPane.appendChild(gutter);
		editorPane.appendChild(stack);

		var previewPane = el("div", "wb__preview");
		var frame = document.createElement("iframe");
		frame.setAttribute(
			"sandbox",
			"allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals allow-forms"
		);
		frame.setAttribute("title", "Vorschau");
		previewPane.appendChild(frame);

		panes.appendChild(editorPane);
		panes.appendChild(previewPane);

		var status = el("div", "wb__status");
		var statusLeft = el("span", null, "");
		var statusRight = el("span", null, "");
		function updateHint() {
			statusRight.textContent =
				active === "html"
					? "Ctrl/⌘ + Enter führt aus · Tab expandiert Kürzel (z. B. ul>li*3)"
					: active === "svg"
					? "Ctrl/⌘ + Enter führt aus · Tab expandiert Kürzel (z. B. g>circle+rect)"
					: "Ctrl/⌘ + Enter führt aus";
		}
		status.appendChild(statusLeft);
		status.appendChild(statusRight);

		root.appendChild(bar);
		root.appendChild(panes);
		root.appendChild(status);

		if (root.dataset.height) {
			var h = root.dataset.height + "px";
			editorPane.style.height = h;
			frame.style.minHeight = h;
		}

		/* ---------------------------------------------------------- Verhalten */

		function syncScroll() {
			layer.scrollTop = code.scrollTop;
			layer.scrollLeft = code.scrollLeft;
			gutter.scrollTop = code.scrollTop;
		}

		/* Zeilennummern und Syntaxfarben nachziehen. Beides haengt am Inhalt des
		   Textfelds und muss nach jeder Aenderung neu gesetzt werden. */
		function redraw() {
			var n = code.value.split("\n").length;
			var out = [];
			for (var i = 1; i <= n; i++) out.push(i);
			gutter.textContent = out.join("\n");

			var lines = window.SITE.highlight(
				code.value,
				active === "css" ? "css" : "html"
			);
			/* Eine Zeile Reserve: die gefaerbte Ebene darf hoeher sein als das
			   Textfeld, aber nie niedriger -- sonst klemmt ihr scrollTop und die
			   Ebenen stehen am Ende versetzt. */
			layerCode.innerHTML = lines.join("\n") + "\n ";

			syncScroll();
		}

		function run() {
			var body = wantsSVG ? buffers.svg : buffers.html;
			var css = wantsCSS && buffers.css != null ? buffers.css : "";
			if (wantsSVG) css = window.SITE.svgDemoCSS + css;
			frame.srcdoc = compose(body != null ? body : "", css);
		}

		var saveTimer = null;
		var runTimer = null;

		function touched() {
			buffers[active] = code.value;
			redraw();

			clearTimeout(runTimer);
			runTimer = setTimeout(run, 700);

			clearTimeout(saveTimer);
			saveTimer = setTimeout(function () {
				var ok = store.set(storeKey(active), code.value);
				statusLeft.className = ok ? "saved" : "";
				statusLeft.textContent = ok
					? "gespeichert"
					: "nicht gespeichert (Browser blockiert den Speicher)";
			}, 500);
		}

		function select(which) {
			buffers[active] = code.value;
			active = which;
			code.value = buffers[which];
			names.forEach(function (n) {
				if (tabBtns[n])
					tabBtns[n].setAttribute("aria-selected", n === which ? "true" : "false");
			});
			redraw();
			updateHint();
			code.focus();
		}

		code.addEventListener("input", touched);
		code.addEventListener("scroll", syncScroll);

		code.addEventListener("keydown", function (e) {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				clearTimeout(runTimer);
				run();
				return;
			}

			if (e.key === "Tab") {
				e.preventDefault();

				var emmetProfile =
					active === "html"
						? EMMET_PROFILE_HTML
						: active === "svg"
						? EMMET_PROFILE_SVG
						: null;
				if (!e.shiftKey && emmetProfile && tryExpandEmmet(code, emmetProfile)) {
					touched();
					return;
				}

				var start = code.selectionStart;
				var end = code.selectionEnd;
				var value = code.value;

				if (start === end && !e.shiftKey) {
					code.value = value.slice(0, start) + "  " + value.slice(end);
					code.selectionStart = code.selectionEnd = start + 2;
				} else {
					var lineStart = value.lastIndexOf("\n", start - 1) + 1;
					var block = value.slice(lineStart, end);
					var shifted = e.shiftKey
						? block.replace(/^ {1,2}/gm, "")
						: block.replace(/^/gm, "  ");
					code.value = value.slice(0, lineStart) + shifted + value.slice(end);
					code.selectionStart = lineStart;
					code.selectionEnd = lineStart + shifted.length;
				}
				touched();
				return;
			}

			if (e.key === "Enter") {
				var pos = code.selectionStart;
				if (pos !== code.selectionEnd) return;
				var lineStart = code.value.lastIndexOf("\n", pos - 1) + 1;
				var indent = (code.value.slice(lineStart, pos).match(/^[ \t]*/) || [
					"",
				])[0];
				if (!indent) return;
				e.preventDefault();
				var before = code.value.slice(0, pos);
				var after = code.value.slice(pos);
				code.value = before + "\n" + indent + after;
				code.selectionStart = code.selectionEnd = pos + 1 + indent.length;
				touched();
			}
		});

		addBtn("Ausführen", "wb__btn--primary", "Vorschau neu aufbauen", function () {
			clearTimeout(runTimer);
			buffers[active] = code.value;
			run();
		});

		if (hasSolution) {
			addBtn(
				"Lösung laden",
				null,
				"Ersetzt Ihren Code durch den Lösungsvorschlag",
				function () {
					if (
						!confirm(
							"Ihr eigener Code in dieser Werkbank wird durch den " +
								"Lösungsvorschlag ersetzt. Fortfahren?"
						)
					)
						return;
					names.forEach(function (which) {
						if (solutions[which] != null) {
							buffers[which] = solutions[which];
							store.set(storeKey(which), solutions[which]);
						}
					});
					code.value = buffers[active];
					redraw();
					run();
				}
			);
		}

		addBtn("Zurücksetzen", null, "Startzustand wiederherstellen", function () {
			if (!confirm("Ihren Code in dieser Werkbank verwerfen?")) return;
			names.forEach(function (which) {
				buffers[which] = seeds[which];
				store.del(storeKey(which));
			});
			code.value = buffers[active];
			statusLeft.textContent = "";
			redraw();
			run();
		});

		addBtn("Herunterladen", null, "Aktuelle Datei speichern", function () {
			buffers[active] = code.value;
			download(fileLabel[active], buffers[active]);
		});

		var fullBtn = addBtn("Vollbild", null, "Werkbank vergrössern", function () {
			var full = root.classList.toggle("is-full");
			fullBtn.textContent = full ? "Schliessen" : "Vollbild";
			document.body.style.overflow = full ? "hidden" : "";
			/* Im Vollbild gibt das Fenster die Hoehe vor. Die Vorgabe aus
			   data-height steht als Inline-Stil am Element und wuerde sonst
			   gewinnen -- darum hier aus- und wieder einschalten. */
			editorPane.style.height =
				full || !root.dataset.height ? "" : root.dataset.height + "px";
			if (!full) {
				root.style.height = "";
			}
			syncScroll();
		});

		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape" && root.classList.contains("is-full")) {
				fullBtn.click();
			}
		});

		code.value = buffers[active];
		names.forEach(function (n) {
			if (tabBtns[n])
				tabBtns[n].setAttribute("aria-selected", n === active ? "true" : "false");
		});
		redraw();
		updateHint();
		run();
	}

	window.Workbench = {
		initAll: function (page, store, compose) {
			document.querySelectorAll(".workbench").forEach(function (root) {
				build(root, page, store, compose);
			});
		},
	};
})();
