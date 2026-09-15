/* ==========================================================================
   Werkbank: Editor mit Reitern (index.html / style.css) und Live-Vorschau.
   Der Code der Schueler wird im Browser (localStorage) gespeichert.
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
		var names = (root.dataset.files || "html").split(",").map(function (s) {
			return s.trim();
		});
		var wantsCSS = names.indexOf("css") !== -1;

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
		};
		if (seeds.html == null)
			seeds.html = wantsCSS ? SKELETON_LINKED : SKELETON_PLAIN;
		if (seeds.css == null) seeds.css = SKELETON_CSS;

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
		};
		/* Der Knopf «Loesung laden» erscheint nur, wenn die Loesungen
		   eingeschaltet sind (?loesungen=1, siehe site.js). */
		var hasSolution =
			window.SITE.showSolutions &&
			(solutions.html != null || solutions.css != null);

		var fileLabel = { html: "index.html", css: "style.css" };
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
		var statusRight = el(
			"span",
			null,
			"Strg/⌘ + Enter führt aus"
		);
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
			frame.srcdoc = compose(
				buffers.html != null ? buffers.html : "",
				wantsCSS && buffers.css != null ? buffers.css : ""
			);
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
