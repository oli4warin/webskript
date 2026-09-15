/* ==========================================================================
   PyRunner: ein gemeinsamer Worker fuer alle Python-Werkbaenke einer Seite.

   Pyodide braucht mehrere Sekunden (und beim ersten Mal einen grossen
   Download) zum Start -- ein eigener Worker pro Werkbank waere darum
   Verschwendung. Laeufe werden der Reihe nach abgearbeitet (eine Klasse
   arbeitet ohnehin nicht an zwei Werkbaenken gleichzeitig).
   ========================================================================== */

(function () {
	"use strict";

	var worker = null;
	var queue = [];
	var busy = false;

	function ensureWorker() {
		if (worker) return worker;
		worker = new Worker("../assets/js/pyworker.js");
		worker.onmessage = function (e) {
			var msg = e.data;
			var current = queue[0];
			if (!current) return;
			current.onMessage(msg);
			if (msg.type === "result") {
				queue.shift();
				busy = false;
				pump();
			}
		};
		worker.onerror = function (e) {
			var current = queue[0];
			if (current) {
				current.onMessage({
					type: "result",
					ok: false,
					output: "",
					error: "Worker-Fehler: " + e.message,
				});
				queue.shift();
			}
			busy = false;
			pump();
		};
		return worker;
	}

	function pump() {
		if (busy || !queue.length) return;
		busy = true;
		ensureWorker().postMessage({ type: "run", code: queue[0].code });
	}

	window.PyRunner = {
		/* onMessage bekommt {type:"status", text} waehrenddessen und genau
		   einmal {type:"result", ok, output, error} am Ende. */
		run: function (code, onMessage) {
			queue.push({ code: code, onMessage: onMessage });
			pump();
		},
	};
})();
