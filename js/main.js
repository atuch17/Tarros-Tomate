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

  /* ---- PAGINA COMPRAR ---- */
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

  if (productos.length && formPedido) {
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
  var formContacto = document.getElementById("form-contacto");
  if (formContacto) {
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
})();
