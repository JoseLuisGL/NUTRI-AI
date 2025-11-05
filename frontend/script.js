document.addEventListener("DOMContentLoaded", () => {
  const chatDiv = document.getElementById("chatHistorial");
  const historialListDiv = document.getElementById("historialList");
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
  const btnEnviar = document.getElementById("btnEnviar");
  const btnRecetas = document.getElementById("btnRecetas");
  const btnGuardar = document.getElementById("btnGuardarChat");
  const inputTexto = document.getElementById("inputTexto");

  // Metas
  const metasList = document.getElementById("metasList");
  const metaInput = document.getElementById("metaInput");
  const btnAgregarMeta = document.getElementById("btnAgregarMeta");

  if (!usuarioActivo) {
    window.location.href = "index.html";
    return;
  }

  const historialKey = `historial_${usuarioActivo.email}`;
  const metasKey = `metas_${usuarioActivo.email}`;
  let historialGlobal = JSON.parse(localStorage.getItem(historialKey) || "[]");
  let historialChat = [];
  let metas = JSON.parse(localStorage.getItem(metasKey) || "[]");

  // ---------------- Metas ----------------
  const renderMetas = () => {
    metasList.innerHTML = metas.map((meta, i) => 
      `<br><li>${meta} <button class="eliminarMeta" data-index="${i}">❌</button></li>`
    ).join("");
  };

  renderMetas();

  metasList.addEventListener("click", (e) => {
    if (e.target.classList.contains("eliminarMeta")) {
      const index = e.target.dataset.index;
      metas.splice(index, 1);
      localStorage.setItem(metasKey, JSON.stringify(metas));
      renderMetas();
    }
  });

  btnAgregarMeta.addEventListener("click", () => {
    const meta = metaInput.value.trim();
    if (!meta) return;
    metas.push(meta);
    localStorage.setItem(metasKey, JSON.stringify(metas));
    renderMetas();
    metaInput.value = "";
  });

  // ---------------- Historial actual ----------------
  const renderHistorial = () => {
    chatDiv.innerHTML = historialChat.map(m => {
      if (m.tipo === "usuario") return `<div class="msg usuario">🧑: ${m.texto}</div>`;
      else return `<div class="msg ia">🤖: ${m.texto}</div>`;
    }).join("");
    chatDiv.scrollTop = chatDiv.scrollHeight;
  };

  // ---------------- Historial guardado ----------------
  const renderHistorialList = () => {
    historialGlobal = JSON.parse(localStorage.getItem(historialKey) || "[]");
    if (!historialGlobal.length) {
      historialListDiv.innerHTML = "No hay chats guardados aún.";
      return;
    }
    historialListDiv.innerHTML = historialGlobal.map((chat, index) => {
      const fecha = new Date(chat.fecha).toLocaleString();
      return `<button class="historialBtn" data-index="${index}">📄 Chat del ${fecha}</button>`;
    }).join("");
  };

  renderHistorialList();

  // ---------------- Enviar mensaje a IA ----------------
  btnEnviar.addEventListener("click", async () => {
    const texto = inputTexto.value.trim();
    if (!texto) return;

    historialChat.push({ tipo: "usuario", texto });
    renderHistorial();
    inputTexto.value = "";

    historialChat.push({ tipo: "ia", texto: "Generando respuesta..." });
    renderHistorial();

    try {
      const metasTexto = metas.length ? "Metas del usuario: " + metas.join(", ") : "";
      const prompt = `
        Eres un nutricionista profesional. El usuario te da la siguiente información:
        "${texto}"
        ${metasTexto}
        Lee también su historial médico y metas anteriores si las tiene.
        Da una recomendación nutricional o plan breve y claro en español.
      `;

      const response = await puter.ai.chat(prompt, { model: "gpt-5-nano" });

      // ---------------- EXTRAER TEXTO PLANO ----------------
      let textoIA = "[Sin respuesta]";
      if (response && response.message && response.message.content) {
        textoIA = response.message.content;
      }

      historialChat.pop(); // quitar mensaje de carga
      historialChat.push({ tipo: "ia", texto: textoIA });
      renderHistorial();

      btnGuardar.disabled = false;

    } catch (error) {
      historialChat.pop();
      historialChat.push({ tipo: "ia", texto: "Error al generar la respuesta: " + error.message });
      renderHistorial();
    }
  });

  // ---------------- Guardar chat ----------------
  btnGuardar.addEventListener("click", () => {
    const chatGuardado = {
      fecha: new Date().toISOString(),
      mensajes: historialChat.map(m => ({ tipo: m.tipo, texto: m.texto })) // SOLO texto
    };
    historialGlobal.push(chatGuardado);
    localStorage.setItem(historialKey, JSON.stringify(historialGlobal));
    alert("Chat guardado ✅");
    btnGuardar.disabled = true;
    historialChat = [];
    renderHistorial();
    renderHistorialList();
  });

  // ---------------- Cargar chat guardado ----------------
  historialListDiv.addEventListener("click", (e) => {
    if (e.target.classList.contains("historialBtn")) {
      const index = e.target.dataset.index;
      historialChat = historialGlobal[index].mensajes;
      renderHistorial();
      alert("Historial cargado ✅");
    }
  });

  // ---------------- Logout ----------------
  document.getElementById("btnLogout").addEventListener("click", () => {
    sessionStorage.removeItem("usuarioActivo");
    window.location.href = "index.html";
  });
});


// ---------------- Ir a recetas ----------------
btnRecetas.addEventListener("click", () => {
    window.location.href = "recetas.html";
});