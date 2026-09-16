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

	var SKELETON_PYTHON = "# Schreiben Sie hier Ihren Code hin\n";

	/* ------------------------------------------------------------------
	   Tab-Vervollstaendigung (Python-Reiter). Kein echtes Sprachverstaendnis
	   (dafuer muesste Pyodide bei jedem Tastendruck gefragt werden) --
	   stattdessen eine kleine, feste Liste aus Schluesselwoertern/Builtins
	   plus ein paar Modulen, die in diesem Kurs vorkommen (siehe
	   PY_MODULE_MEMBERS), ergaenzt um das, was im Code selbst schon steht
	   (eigene Funktionen, Klassen, Variablen). Genau wie im PyTamaro-
	   Playground zeigt Tab bei mehreren Treffern eine kleine Auswahlliste.
	   ------------------------------------------------------------------ */

	var PY_KEYWORDS = (
		"False None True and as assert async await break class continue def " +
		"del elif else except finally for from global if import in is lambda " +
		"nonlocal not or pass raise return try while with yield"
	).split(" ");

	var PY_BUILTINS = (
		"abs all any bin bool chr dict dir enumerate filter float format " +
		"frozenset getattr hasattr hex input int isinstance issubclass iter " +
		"len list map max min next oct open ord pow print range repr " +
		"reversed round set slice sorted str sum tuple type zip"
	).split(" ");

	/* Mitglieder der Module, die in den Uebungen tatsaechlich benutzt werden
	   (matplotlib fuers Plotten, math/random/numpy als gaengige Helfer). */
	var PY_MODULE_MEMBERS = {
		"matplotlib.pyplot": [
			["plot", "Funktion"],
			["scatter", "Funktion"],
			["bar", "Funktion"],
			["hist", "Funktion"],
			["show", "Funktion"],
			["figure", "Funktion"],
			["subplots", "Funktion"],
			["subplot", "Funktion"],
			["xlabel", "Funktion"],
			["ylabel", "Funktion"],
			["title", "Funktion"],
			["legend", "Funktion"],
			["grid", "Funktion"],
			["xlim", "Funktion"],
			["ylim", "Funktion"],
			["xticks", "Funktion"],
			["yticks", "Funktion"],
			["axhline", "Funktion"],
			["axvline", "Funktion"],
			["fill_between", "Funktion"],
			["annotate", "Funktion"],
			["text", "Funktion"],
			["savefig", "Funktion"],
			["close", "Funktion"],
		],
		math: [
			["pi", "Konstante"],
			["e", "Konstante"],
			["inf", "Konstante"],
			["nan", "Konstante"],
			["sqrt", "Funktion"],
			["floor", "Funktion"],
			["ceil", "Funktion"],
			["exp", "Funktion"],
			["log", "Funktion"],
			["log2", "Funktion"],
			["log10", "Funktion"],
			["sin", "Funktion"],
			["cos", "Funktion"],
			["tan", "Funktion"],
			["radians", "Funktion"],
			["degrees", "Funktion"],
			["factorial", "Funktion"],
			["gcd", "Funktion"],
			["isnan", "Funktion"],
			["pow", "Funktion"],
		],
		numpy: [
			["array", "Funktion"],
			["linspace", "Funktion"],
			["arange", "Funktion"],
			["zeros", "Funktion"],
			["ones", "Funktion"],
			["mean", "Funktion"],
			["std", "Funktion"],
			["sum", "Funktion"],
			["sqrt", "Funktion"],
			["exp", "Funktion"],
			["log", "Funktion"],
			["sin", "Funktion"],
			["cos", "Funktion"],
			["pi", "Konstante"],
			["max", "Funktion"],
			["min", "Funktion"],
			["abs", "Funktion"],
			["round", "Funktion"],
		],
		random: [
			["random", "Funktion"],
			["randint", "Funktion"],
			["choice", "Funktion"],
			["shuffle", "Funktion"],
			["seed", "Funktion"],
			["uniform", "Funktion"],
			["sample", "Funktion"],
		],
	};

	/* Methoden pro Python-Grundtyp -- fuer Variablen, deren Typ sich aus
	   ihrer letzten Zuweisung erraten laesst (siehe pyInferType). Damit
	   vervollstaendigt z. B. "x.app" zu "x.append(", wenn irgendwo
	   "x = [...]" steht. */
	var PY_TYPE_MEMBERS = {
		list: [
			["append", "Methode"],
			["extend", "Methode"],
			["insert", "Methode"],
			["remove", "Methode"],
			["pop", "Methode"],
			["clear", "Methode"],
			["index", "Methode"],
			["count", "Methode"],
			["sort", "Methode"],
			["reverse", "Methode"],
			["copy", "Methode"],
		],
		dict: [
			["get", "Methode"],
			["keys", "Methode"],
			["values", "Methode"],
			["items", "Methode"],
			["update", "Methode"],
			["pop", "Methode"],
			["popitem", "Methode"],
			["clear", "Methode"],
			["setdefault", "Methode"],
			["copy", "Methode"],
		],
		str: [
			["upper", "Methode"],
			["lower", "Methode"],
			["strip", "Methode"],
			["lstrip", "Methode"],
			["rstrip", "Methode"],
			["split", "Methode"],
			["join", "Methode"],
			["replace", "Methode"],
			["find", "Methode"],
			["startswith", "Methode"],
			["endswith", "Methode"],
			["format", "Methode"],
			["capitalize", "Methode"],
			["title", "Methode"],
			["isdigit", "Methode"],
			["isalpha", "Methode"],
		],
		set: [
			["add", "Methode"],
			["remove", "Methode"],
			["discard", "Methode"],
			["pop", "Methode"],
			["clear", "Methode"],
			["union", "Methode"],
			["intersection", "Methode"],
			["difference", "Methode"],
			["update", "Methode"],
			["issubset", "Methode"],
			["issuperset", "Methode"],
		],
		tuple: [
			["count", "Methode"],
			["index", "Methode"],
		],
		int: [
			["bit_length", "Methode"],
			["to_bytes", "Methode"],
		],
		float: [
			["is_integer", "Methode"],
			["hex", "Methode"],
		],
	};

	/* Kandidaten dieser Art werden mit einer oeffnenden Klammer eingesetzt
	   ("append" -> "append("), weil sie ohne Aufruf so gut wie nie gemeint
	   sind. */
	function pyIsCallable(kind) {
		return (
			kind === "Funktion" ||
			kind === "Methode" ||
			kind === "eingebaut" ||
			kind === "Klasse"
		);
	}

	/* Guesst den Typ einer Variable aus ihrer letzten Zuweisung vor der
	   Cursorposition -- reicht fuer die literalen Zuweisungen ("x = [...]"),
	   wie sie in den Uebungen vorkommen; keine echte Typanalyse. */
	function pyInferType(source, name, beforePos) {
		var re = new RegExp(
			"(?:^|\\n)[ \\t]*" + name + "[ \\t]*=(?!=)[ \\t]*([^\\n]*)",
			"g"
		);
		var m,
			rhs = null,
			bestIndex = -1;
		while ((m = re.exec(source))) {
			if (m.index <= beforePos && m.index > bestIndex) {
				bestIndex = m.index;
				rhs = m[1];
			}
		}
		if (rhs == null) return null;
		/* Ein "#" schneidet auch innerhalb eines String-Literals ab (z. B.
		   x = "a#b") -- stoert hier nicht, weil danach nur noch auf das
		   Anfangszeichen geprueft wird. */
		rhs = rhs.replace(/#.*/, "").trim();
		if (/^\[/.test(rhs) || /^list\s*\(/.test(rhs)) return "list";
		if (/^\{/.test(rhs)) {
			var body = rhs.replace(/^\{/, "").split("}")[0];
			return body.trim() === "" || /:/.test(body) ? "dict" : "set";
		}
		if (/^dict\s*\(/.test(rhs)) return "dict";
		if (/^set\s*\(/.test(rhs)) return "set";
		if (/^["']/.test(rhs) || /^str\s*\(/.test(rhs)) return "str";
		if (/^\(/.test(rhs) || /^tuple\s*\(/.test(rhs)) return "tuple";
		if (/^-?\d+[ \t]*$/.test(rhs)) return "int";
		if (/^-?\d*\.\d+/.test(rhs)) return "float";
		return null;
	}

	function pyTypeMemberCandidates(source, name, beforePos) {
		var type = pyInferType(source, name, beforePos);
		var members = type && PY_TYPE_MEMBERS[type];
		if (!members) return [];
		return members.map(function (pair) {
			return { name: pair[0], kind: pair[1], call: pyIsCallable(pair[1]) };
		});
	}

	/* {Alias: Modulname} aus allen "import x"/"import x as y" im Code. */
	function pyImportAliases(source) {
		var map = {};
		var re = /^[ \t]*import\s+([\w.]+)(?:\s+as\s+(\w+))?/gm;
		var m;
		while ((m = re.exec(source))) {
			map[m[2] || m[1].split(".").pop()] = m[1];
		}
		return map;
	}

	function pyMemberCandidates(source, alias) {
		var mod = pyImportAliases(source)[alias];
		var members = mod && PY_MODULE_MEMBERS[mod];
		if (!members) return [];
		return members.map(function (pair) {
			return { name: pair[0], kind: pair[1], call: pyIsCallable(pair[1]) };
		});
	}

	/* Namen, die im Code selbst schon vorkommen: eigene Funktionen, Klassen,
	   Variablen (Zuweisung, for-Schleife, with/import ... as, Parameter) und
	   gezielt importierte Namen (from x import a, b). Es wird der ganze
	   Puffer durchsucht, nicht nur der aktuelle Sichtbarkeitsbereich -- fuer
	   eine kleine Vorschlagsliste reicht das. */
	function pyLocalCandidates(source) {
		var out = [];
		function add(name, kind) {
			if (name) out.push({ name: name, kind: kind, call: pyIsCallable(kind) });
		}

		var re = /\bdef\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g;
		var m;
		while ((m = re.exec(source))) {
			add(m[1], "Funktion");
			m[2].split(",").forEach(function (param) {
				var name = param.split("=")[0].split(":")[0].trim();
				if (/^[A-Za-z_]\w*$/.test(name) && name !== "self")
					add(name, "Variable");
			});
		}

		re = /\bclass\s+([A-Za-z_]\w*)/g;
		while ((m = re.exec(source))) add(m[1], "Klasse");

		re = /^[ \t]*([A-Za-z_]\w*)\s*=(?!=)/gm;
		while ((m = re.exec(source))) add(m[1], "Variable");

		re = /\bfor\s+([A-Za-z_]\w*)\s+in\b/g;
		while ((m = re.exec(source))) add(m[1], "Variable");

		re = /\bas\s+([A-Za-z_]\w*)/g;
		while ((m = re.exec(source))) add(m[1], "Variable");

		re = /\bfrom\s+[\w.]+\s+import\s+([^\n#]+)/g;
		while ((m = re.exec(source))) {
			m[1].split(",").forEach(function (part) {
				var name = part.trim().split(/\s+as\s+/).pop().trim();
				if (/^[A-Za-z_]\w*$/.test(name)) add(name, "Funktion");
			});
		}

		return out;
	}

	/* Liefert null (normales Tab soll einruecken) oder {from, to, candidates}
	   fuer die Stelle vor dem Cursor. Bei "x." zaehlt sowohl ein bekannter
	   Modul-Alias (plt, math, ...) als auch der aus einer Zuweisung
	   erratene Grundtyp von x (siehe pyInferType) -- so wird "x.app" zu
	   "x.append(" vervollstaendigt, wenn irgendwo "x = [...]" steht. */
	function pyCompletionContext(source, pos) {
		var lineStart = source.lastIndexOf("\n", pos - 1) + 1;
		var line = source.slice(lineStart, pos);

		var pool, prefix;
		var attr = line.match(/([A-Za-z_]\w*)\.([A-Za-z0-9_]*)$/);
		if (attr) {
			prefix = attr[2];
			pool = pyMemberCandidates(source, attr[1]).concat(
				pyTypeMemberCandidates(source, attr[1], pos)
			);
		} else {
			var word = line.match(/[A-Za-z_]\w*$/);
			if (!word) return null;
			prefix = word[0];
			pool = PY_KEYWORDS.map(function (k) {
				return { name: k, kind: "Schlüsselwort", call: false };
			})
				.concat(
					PY_BUILTINS.map(function (b) {
						return { name: b, kind: "eingebaut", call: true };
					})
				)
				.concat(pyLocalCandidates(source));
		}

		var seen = {};
		var matches = pool.filter(function (c) {
			if (c.name === prefix || c.name.indexOf(prefix) !== 0) return false;
			if (seen[c.name]) return false;
			seen[c.name] = true;
			return true;
		});
		if (!matches.length) return null;
		matches.sort(function (a, b) {
			return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
		});

		return { from: pos - prefix.length, to: pos, candidates: matches.slice(0, 8) };
	}

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
		var wantsPython = names.indexOf("python") !== -1;

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
			python: root.dataset.seedPython
				? window.SITE.fileContent(root.dataset.seedPython)
				: templateSeed("python"),
		};
		if (seeds.html == null)
			seeds.html = wantsCSS ? SKELETON_LINKED : SKELETON_PLAIN;
		if (seeds.css == null) seeds.css = SKELETON_CSS;
		if (seeds.svg == null) seeds.svg = SKELETON_SVG;
		if (seeds.python == null) seeds.python = SKELETON_PYTHON;

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
			python: root.dataset.solPython
				? window.SITE.fileContent(root.dataset.solPython)
				: null,
		};
		/* Der Knopf «Loesung laden» erscheint nur, wenn die Loesungen
		   eingeschaltet sind (?loesungen=1, siehe site.js). */
		var hasSolution =
			window.SITE.showSolutions &&
			names.some(function (which) {
				return solutions[which] != null;
			});

		var fileLabel = {
			html: "index.html",
			css: "style.css",
			svg: "bild.svg",
			python: "aufgabe.py",
		};
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
		var frame = null;
		var consoleOut = null;
		var imagesWrap = null;
		if (wantsPython) {
			previewPane.classList.add("wb__preview--console");
			consoleOut = el("pre", "wb__console", "");
			imagesWrap = el("div", "wb__images");
			previewPane.appendChild(consoleOut);
			previewPane.appendChild(imagesWrap);
		} else {
			frame = document.createElement("iframe");
			frame.setAttribute(
				"sandbox",
				"allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals allow-forms"
			);
			frame.setAttribute("title", "Vorschau");
			previewPane.appendChild(frame);
		}

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
					: active === "python"
					? "Ctrl/⌘ + Enter führt aus · Tab vervollständigt"
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
			if (frame) frame.style.minHeight = h;
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
				active === "css" ? "css" : active === "python" ? "python" : "html"
			);
			/* Eine Zeile Reserve: die gefaerbte Ebene darf hoeher sein als das
			   Textfeld, aber nie niedriger -- sonst klemmt ihr scrollTop und die
			   Ebenen stehen am Ende versetzt. */
			layerCode.innerHTML = lines.join("\n") + "\n ";

			syncScroll();
		}

		/* ------------------------------------------------ Tab-Vervollstaendigung
		   (nur fuer den Python-Reiter genutzt, siehe pyCompletionContext oben).
		   Die Liste ist ein <ul> ueber dem Textfeld, in derselben
		   Koordinatenebene wie .wb__hl (siehe .wb__stack in style.css) --
		   Position wird ueber Zeile/Spalte des Cursors plus Zeichenmass
		   (monospace) berechnet. */
		var acList = null;
		var acItems = [];
		var acIndex = 0;
		var acFrom = 0;
		var acTo = 0;
		var acMetrics = null;

		function acCharMetrics() {
			if (acMetrics) return acMetrics;
			var cs = window.getComputedStyle(code);
			if (!acCharMetrics._canvas)
				acCharMetrics._canvas = document.createElement("canvas");
			var ctx = acCharMetrics._canvas.getContext("2d");
			ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
			acMetrics = {
				charWidth: ctx.measureText("0").width,
				lineHeight: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3,
				paddingLeft: parseFloat(cs.paddingLeft) || 0,
				paddingTop: parseFloat(cs.paddingTop) || 0,
			};
			return acMetrics;
		}

		function acCaretCoords(pos) {
			var before = code.value.slice(0, pos).split("\n");
			var row = before.length - 1;
			var col = before[before.length - 1].length;
			var m = acCharMetrics();
			return {
				left: m.paddingLeft + col * m.charWidth - code.scrollLeft,
				top: m.paddingTop + (row + 1) * m.lineHeight - code.scrollTop,
			};
		}

		function acHide() {
			if (acList) acList.remove();
			acList = null;
			acItems = [];
		}

		function acHighlight() {
			if (!acList) return;
			for (var i = 0; i < acList.children.length; i++) {
				acList.children[i].classList.toggle("is-active", i === acIndex);
			}
			var current = acList.children[acIndex];
			if (current) current.scrollIntoView({ block: "nearest" });
		}

		function acMove(delta) {
			acIndex = (acIndex + delta + acItems.length) % acItems.length;
			acHighlight();
		}

		function acAccept() {
			var item = acItems[acIndex];
			acHide();
			if (!item) return;
			var value = code.value;
			var insert = item.name + (item.call ? "(" : "");
			code.value = value.slice(0, acFrom) + insert + value.slice(acTo);
			code.selectionStart = code.selectionEnd = acFrom + insert.length;
			touched();
			code.focus();
		}

		function acShow(candidates, from, to) {
			acHide();
			acItems = candidates;
			acIndex = 0;
			acFrom = from;
			acTo = to;

			acList = el("ul", "wb__ac");
			acList.setAttribute("role", "listbox");
			candidates.forEach(function (item, i) {
				var li = el("li", "wb__ac__item");
				li.setAttribute("role", "option");
				li.appendChild(el("span", "wb__ac__name", item.name));
				li.appendChild(el("span", "wb__ac__kind", item.kind));
				/* mousedown statt click: das Textfeld darf den Fokus (und die
				   Cursorposition acFrom/acTo) nicht schon vorher verlieren. */
				li.addEventListener("mousedown", function (e) {
					e.preventDefault();
					acIndex = i;
					acAccept();
				});
				acList.appendChild(li);
			});

			var coords = acCaretCoords(from);
			acList.style.left = coords.left + "px";
			acList.style.top = coords.top + "px";
			stack.appendChild(acList);
			acHighlight();
		}

		code.addEventListener("blur", acHide);
		code.addEventListener("click", acHide);

		var runBtn = null;

		function showPythonPlaceholder() {
			consoleOut.hidden = false;
			consoleOut.textContent =
				'Noch nicht ausgeführt. Klicken Sie auf "Ausführen" oder ' +
				"drücken Sie Ctrl/⌘ + Enter.";
			consoleOut.classList.remove("wb__console--error");
			imagesWrap.innerHTML = "";
		}

		/* Oeffnet eine Grafik-Ausgabe allein (ohne den Rest der Seite) in einem
		   neuen Tab/Fenster. */
		function openImageStandalone(dataUrl) {
			var win = window.open("", "_blank");
			if (!win) return;
			win.document.write(
				"<!doctype html><title>Grafik-Ausgabe</title>" +
					"<style>body{margin:0;min-height:100vh;display:flex;" +
					"align-items:center;justify-content:center;background:#000}" +
					"img{max-width:100%;max-height:100vh}</style>" +
					'<img src="' +
					dataUrl +
					'" alt="Grafik-Ausgabe (matplotlib)">'
			);
			win.document.close();
		}

		function runPython() {
			consoleOut.hidden = false;
			consoleOut.textContent = "läuft …";
			consoleOut.classList.remove("wb__console--error");
			imagesWrap.innerHTML = "";
			if (runBtn) runBtn.disabled = true;
			window.PyRunner.run(buffers.python, function (msg) {
				if (msg.type === "status") {
					consoleOut.hidden = false;
					consoleOut.textContent = msg.text;
					return;
				}
				var text = msg.output || "";
				if (!msg.ok) {
					text += (text ? "\n\n" : "") + "Fehler:\n" + msg.error;
				}
				var images = msg.images || [];
				/* Bei einer reinen Grafik-Ausgabe (z. B. matplotlib) ohne Text
				   bleibt die Konsole aus -- es soll nur das Bild erscheinen. */
				if (!text && images.length) {
					consoleOut.hidden = true;
					consoleOut.textContent = "";
				} else {
					consoleOut.hidden = false;
					consoleOut.textContent = text || "(keine Ausgabe)";
				}
				consoleOut.classList.toggle("wb__console--error", !msg.ok);
				imagesWrap.innerHTML = "";
				images.forEach(function (b64) {
					var dataUrl = "data:image/png;base64," + b64;
					var img = document.createElement("img");
					img.src = dataUrl;
					img.alt = "Grafik-Ausgabe (matplotlib)";
					img.tabIndex = 0;
					img.addEventListener("click", function () {
						openImageStandalone(dataUrl);
					});
					img.addEventListener("keydown", function (e) {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							openImageStandalone(dataUrl);
						}
					});
					imagesWrap.appendChild(img);
				});
				if (runBtn) runBtn.disabled = false;
			});
		}

		function run() {
			if (wantsPython) {
				runPython();
				return;
			}
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

			/* Bei Python nicht automatisch bei jedem Tastendruck ausfuehren --
			   das Laden/Rechnen mit Pyodide ist zu teuer dafuer. Nur Ctrl/Cmd
			   + Enter oder der Knopf loesen einen Lauf aus. */
			if (!wantsPython) {
				clearTimeout(runTimer);
				runTimer = setTimeout(run, 700);
			}

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
			acHide();
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
		code.addEventListener("scroll", function () {
			syncScroll();
			acHide();
		});

		code.addEventListener("keydown", function (e) {
			if (acList) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					acMove(1);
					return;
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					acMove(-1);
					return;
				}
				if (e.key === "Tab" || (e.key === "Enter" && !e.metaKey && !e.ctrlKey)) {
					e.preventDefault();
					acAccept();
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					acHide();
					return;
				}
				acHide();
			}

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

				if (wantsPython && start === end && !e.shiftKey) {
					var ctx = pyCompletionContext(value, start);
					if (ctx) {
						if (ctx.candidates.length === 1) {
							var only = ctx.candidates[0];
							var onlyInsert = only.name + (only.call ? "(" : "");
							code.value = value.slice(0, ctx.from) + onlyInsert + value.slice(ctx.to);
							code.selectionStart = code.selectionEnd = ctx.from + onlyInsert.length;
							touched();
						} else {
							acShow(ctx.candidates, ctx.from, ctx.to);
						}
						return;
					}
				}

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

		runBtn = addBtn(
			"Ausführen",
			"wb__btn--primary",
			wantsPython ? "Code ausführen" : "Vorschau neu aufbauen",
			function () {
				clearTimeout(runTimer);
				buffers[active] = code.value;
				run();
			}
		);

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
					if (wantsPython) showPythonPlaceholder();
					else run();
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
			if (wantsPython) showPythonPlaceholder();
			else run();
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
		if (wantsPython) {
			/* Nicht sofort beim Laden der Seite ausfuehren: das wuerde bei
			   jedem Seitenaufruf ungefragt Pyodide (und scipy) herunterladen. */
			showPythonPlaceholder();
		} else {
			run();
		}
	}

	window.Workbench = {
		initAll: function (page, store, compose) {
			document.querySelectorAll(".workbench").forEach(function (root) {
				build(root, page, store, compose);
			});
		},
	};
})();
