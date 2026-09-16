/* ==========================================================================
   Web Worker: fuehrt Python-Code der Schueler mit Pyodide aus.

   Pyodide selbst (samt numpy/scipy/matplotlib) kommt von einem CDN --
   anders als der Rest dieser Seite funktioniert die Python-Werkbank darum
   NICHT ohne Internetverbindung und nicht rein ueber file:// (siehe
   README). Das Laden beim ersten "Ausfuehren" dauert je nach Verbindung
   eine ganze Weile, weil scipy allein schon einige zehn MB umfasst.

   Laeuft in einem eigenen Worker (nicht im UI-Thread), damit eine lange
   Rechnung die Seite nicht einfriert.
   ========================================================================== */

/* Bei Bedarf auf eine neuere Pyodide-Version anheben, siehe
   https://pyodide.org/en/stable/project/changelog.html -- diese Version ist
   nur als aktuell zum Zeitpunkt des Schreibens bekannt, keine Garantie. */
var PYODIDE_VERSION = "0.26.4";

importScripts(
	"https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/pyodide.js"
);

var pyodideReady = null;

/* matplotlib nur fuer die Beispiel-Listings im Theorieteil (die Uebungen
   selbst brauchen es nicht). Ohne echtes Fenster/Canvas im Worker muss der
   Agg-Backend erzwungen werden -- einmalig beim Laden, denn matplotlib legt
   sein Backend beim ersten Import von pyplot fest.

   dpi=200 statt der matplotlib-Voreinstellung (100), weil die Vorschau nur
   gut die halbe Seitenbreite bekommt -- bei 100 dpi wirken die PNGs auf
   hochaufloesenden (Retina-)Bildschirmen unscharf. */
var FIGURE_CAPTURE = [
	"import sys as _sys",
	"_images = []",
	'if "matplotlib.pyplot" in _sys.modules:',
	"    import io as _io, base64 as _base64",
	'    _plt = _sys.modules["matplotlib.pyplot"]',
	"    for _num in _plt.get_fignums():",
	"        _fig = _plt.figure(_num)",
	'        _buf = _io.BytesIO()',
	'        _fig.savefig(_buf, format="png", dpi=200, bbox_inches="tight")',
	"        _images.append(_base64.b64encode(_buf.getvalue()).decode('ascii'))",
	'    _plt.close("all")',
	"import json as _json",
	"_json.dumps(_images)",
].join("\n");

function getPyodide() {
	if (!pyodideReady) {
		pyodideReady = loadPyodide({
			indexURL:
				"https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/",
		}).then(function (pyodide) {
			return pyodide
				.loadPackage(["numpy", "scipy", "matplotlib"])
				.then(function () {
					/* Im Worker gibt es kein Fenster, in das plt.show() etwas
					   malen koennte -- die Figuren werden stattdessen ueber
					   FIGURE_CAPTURE als PNG eingesammelt. plt.show() ist damit
					   ein bewusstes No-Op, die deswegen von matplotlib
					   ausgeloeste UserWarning also erwartet und wird hier
					   unterdrueckt, statt den Schuelerinnen und Schuelern in
					   der Ausgabe zu erscheinen. */
					return pyodide.runPythonAsync(
						'import matplotlib\n' +
							'matplotlib.use("Agg")\n' +
							'import warnings\n' +
							'warnings.filterwarnings(\n' +
							'    "ignore",\n' +
							'    message="Matplotlib is currently using agg",\n' +
							')\n'
					);
				})
				.then(function () {
					return pyodide;
				});
		});
	}
	return pyodideReady;
}

self.onmessage = function (e) {
	var msg = e.data;
	if (!msg || msg.type !== "run") return;

	if (!pyodideReady) {
		self.postMessage({
			type: "status",
			text:
				"Python-Umgebung wird geladen (einmalig pro Seitenaufruf, " +
				"je nach Verbindung bis zu einer Minute) …",
		});
	} else {
		self.postMessage({ type: "status", text: "wird ausgeführt …" });
	}

	getPyodide()
		.then(function (pyodide) {
			self.postMessage({ type: "status", text: "wird ausgeführt …" });

			/* setStdout/setStderr rufen "batched" pro Zeile auf, aber OHNE das
			   abschliessende Newline (das wird von Pyodide beim Zeilenumbruch
			   im Stream abgeschnitten) -- darum hier wieder anhaengen, sonst
			   verschmelzen mehrere print()-Aufrufe zu einer Zeile. */
			var out = [];
			pyodide.setStdout({
				batched: function (s) {
					out.push(s + "\n");
				},
			});
			pyodide.setStderr({
				batched: function (s) {
					out.push(s + "\n");
				},
			});

			/* Jeder Lauf bekommt frische globale Variablen, damit Reste aus
			   einer fruaeheren Ausfuehrung (z. B. in einer anderen Werkbank
			   auf derselben Seite) nicht ploetzlich sichtbar sind. */
			var globals = pyodide.toPy({});
			return pyodide
				.runPythonAsync(msg.code, { globals: globals })
				.then(function () {
					/* Offene matplotlib-Figuren (falls welche erzeugt wurden)
					   als PNG einsammeln -- im selben globals-Dict, damit die
					   Nachbearbeitung die Figuren des Laufs sieht. Schlaegt
					   das aus irgendeinem Grund fehl, wird die Ausgabe
					   trotzdem angezeigt, nur ohne Bilder. */
					return pyodide
						.runPythonAsync(FIGURE_CAPTURE, { globals: globals })
						.catch(function () {
							return "[]";
						});
				})
				.then(function (imagesJson) {
					var images = [];
					try {
						images = JSON.parse(imagesJson) || [];
					} catch (e) {
						images = [];
					}
					self.postMessage({
						type: "result",
						ok: true,
						output: out.join(""),
						images: images,
					});
				})
				.catch(function (err) {
					self.postMessage({
						type: "result",
						ok: false,
						output: out.join(""),
						error: String((err && err.message) || err),
					});
				})
				.finally(function () {
					globals.destroy();
				});
		})
		.catch(function (err) {
			self.postMessage({
				type: "result",
				ok: false,
				output: "",
				error:
					"Pyodide konnte nicht geladen werden (keine Internetverbindung?): " +
					String((err && err.message) || err),
			});
		});
};
