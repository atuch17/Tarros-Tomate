/* Los Tomates de Encarna - interaccion (sin librerias) */
(function () {
  "use strict";

  var CFG = window.TOMATES || {};
  var eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

  function enlaceWhatsApp(texto) {
    return "https://wa.me/" + encodeURIComponent(CFG.whatsapp || "") + "?text=" + encodeURIComponent(texto);
  }
  function limpiar(valor, max) {
    return String(valor || "").replace(/\s+/g, " ").trim().slice(0, max);
  }
  function crear(tag, clase, texto) {
    var el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /* ---- Datos del config en la pagina ---- */
  function hidratarConfig() {
    document.querySelectorAll("[data-telefono]").forEach(function (el) {
      el.textContent = CFG.telefonoVisible || "";
      if (el.tagName === "A") el.href = "tel:+" + (CFG.whatsapp || "");
    });
    document.querySelectorAll("[data-whatsapp-link]").forEach(function (el) {
      el.href = enlaceWhatsApp("Hola Encarna 👋 Quería preguntarte una cosa.");
    });
    document.querySelectorAll("[data-pago]").forEach(function (el) {
      el.textContent = CFG.pago || "";
    });
  }

  /* ---- PAGINA COMPRAR ---- */
  function iniciarComprar() {
    var productos = Array.prototype.slice.call(document.querySelectorAll(".prod")).map(function (el) {
      return {
        nombre: el.getAttribute("data-nombre"),
        precio: parseFloat(el.getAttribute("data-precio")),
        qty: 0,
        valor: el.querySelector(".qty-val"),
        el: el
      };
    });
    var formPedido = document.getElementById("pedido");
    if (!productos.length || !formPedido) return;

    var resumen = document.getElementById("resumen");
    var avisoPedido = document.getElementById("aviso-pedido");
    var errorPedido = document.getElementById("error-pedido");

    function lineas() {
      return productos.filter(function (p) { return p.qty > 0; });
    }
    function total() {
      return lineas().reduce(function (s, p) { return s + p.qty * p.precio; }, 0);
    }

    function pintar() {
      productos.forEach(function (p) { p.valor.textContent = p.qty; });
      var sel = lineas();
      resumen.textContent = "";
      if (!sel.length) {
        resumen.appendChild(crear("p", "vacio", "Elige cuántos tarros quieres y te pediremos tus datos 🍅"));
        formPedido.hidden = true;
        avisoPedido.hidden = true;
        return;
      }
      sel.forEach(function (p) {
        var fila = crear("div", "fila");
        fila.appendChild(crear("span", "", p.qty + " × " + p.nombre));
        fila.appendChild(crear("span", "", eur.format(p.qty * p.precio)));
        resumen.appendChild(fila);
      });
      var t = crear("div", "total");
      t.appendChild(crear("span", "", "Total"));
      t.appendChild(crear("span", "", eur.format(total())));
      resumen.appendChild(t);
      formPedido.hidden = false;
    }

    productos.forEach(function (p) {
      p.el.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-delta]");
        if (!b) return;
        p.qty = Math.max(0, Math.min(20, p.qty + parseInt(b.getAttribute("data-delta"), 10)));
        pintar();
      });
    });

    formPedido.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = limpiar(formPedido.elements.nombre.value, 80);
      var direccion = limpiar(formPedido.elements.direccion.value, 200);
      errorPedido.textContent = "";
      if (!lineas().length) { return; }
      if (!nombre || !direccion) {
        errorPedido.textContent = "Escribe tu nombre y tu dirección para poder enviarte el pedido.";
        return;
      }
      var msg = "Hola Encarna 👋 Quiero hacer un pedido:\n\n" +
        lineas().map(function (p) {
          return "• " + p.qty + " × " + p.nombre + " — " + eur.format(p.qty * p.precio);
        }).join("\n") +
        "\n\nTotal: " + eur.format(total()) +
        "\n\nNombre: " + nombre +
        "\nDirección de entrega: " + direccion +
        "\n\n¡Gracias! 🍅";
      var url = enlaceWhatsApp(msg);

      window.open(url, "_blank", "noopener");

      avisoPedido.textContent = "";
      avisoPedido.appendChild(document.createTextNode("Se ha abierto WhatsApp con tu pedido. ¡Solo tienes que pulsar enviar! Si no se abrió, "));
      var a = crear("a", "", "pulsa aquí");
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      avisoPedido.appendChild(a);
      avisoPedido.appendChild(document.createTextNode("."));
      avisoPedido.hidden = false;
    });

    pintar();
  }

  /* ---- PAGINA CONTACTO ---- */
  function iniciarContacto() {
    var formContacto = document.getElementById("form-contacto");
    if (!formContacto) return;
    var errorC = document.getElementById("error-contacto");
    formContacto.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = limpiar(formContacto.elements.nombre.value, 80);
      var mensaje = limpiar(formContacto.elements.mensaje.value, 600);
      errorC.textContent = "";
      if (!nombre || !mensaje) {
        errorC.textContent = "Escribe tu nombre y tu mensaje.";
        return;
      }
      window.open(enlaceWhatsApp("Hola Encarna, soy " + nombre + ". " + mensaje), "_blank", "noopener");
    });
  }

  function iniciarPagina() {
    hidratarConfig();
    iniciarComprar();
    iniciarContacto();
  }
  iniciarPagina();

  /* ==========================================================
     NAVEGACION SUAVE
     Al pulsar un enlace interno solo se cambia la parte central:
     las imagenes de las esquinas, el menu y la banda roja NO se
     vuelven a cargar. Cada seccion sigue teniendo su propia URL
     (Google y los enlaces compartidos funcionan igual), y si algo
     falla se carga la pagina de forma normal.
     ========================================================== */
  if (location.protocol === "file:" || !window.fetch || !window.history.pushState) return;

  var cache = {};
  function traer(url) {
    if (!cache[url]) {
      cache[url] = fetch(url, { credentials: "same-origin" }).then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.text();
      });
      cache[url].catch(function () { delete cache[url]; });
    }
    return cache[url];
  }

  function esInterno(a) {
    if (!a || a.target || a.hasAttribute("download")) return false;
    if (a.origin !== location.origin) return false;
    if (!/(\.html|\/)$/.test(a.pathname)) return false;
    if (a.pathname === location.pathname && a.hash) return false;
    return true;
  }

  function copiarMeta(doc, selector, atributo) {
    var nuevo = doc.querySelector(selector), actual = document.querySelector(selector);
    if (nuevo && actual) actual.setAttribute(atributo, nuevo.getAttribute(atributo));
  }

  function ir(url, empujar) {
    traer(url).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var nuevo = doc.querySelector("main"), viejo = document.querySelector("main");
      var nav = doc.querySelector(".nav"), navViejo = document.querySelector(".nav");
      if (!nuevo || !viejo || !nav || !navViejo) throw new Error("estructura");

      document.title = doc.title;
      copiarMeta(doc, 'meta[name="description"]', "content");
      copiarMeta(doc, 'link[rel="canonical"]', "href");

      nuevo = document.importNode(nuevo, true);
      nuevo.classList.add("aparece");
      viejo.replaceWith(nuevo);
      navViejo.replaceWith(document.importNode(nav, true));

      if (empujar) history.pushState({}, "", url);
      window.scrollTo(0, 0);
      iniciarPagina();
      nuevo.setAttribute("tabindex", "-1");
      nuevo.focus({ preventScroll: true });
    }).catch(function () {
      location.href = url;   // plan B: carga normal
    });
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a");
    if (!esInterno(a)) return;
    e.preventDefault();
    if (a.href === location.href) return;
    ir(a.href, true);
  });

  // Precarga la pagina al pasar el raton o tocar, para que el cambio sea instantaneo
  function precargar(e) {
    var a = e.target.closest && e.target.closest("a");
    if (esInterno(a)) traer(a.href).catch(function () {});
  }
  document.addEventListener("mouseover", precargar);
  document.addEventListener("touchstart", precargar, { passive: true });
  document.addEventListener("focusin", precargar);

  window.addEventListener("popstate", function () { ir(location.href, false); });
})();
