document.addEventListener("DOMContentLoaded", () => {
  const resultadoDiv = document.getElementById("resultado");
  const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

  // Si no hay sesión activa, redirigir al login
  if (!usuarioActivo) {
    window.location.href = "index.html";
    return;
  }

  // Logout
  document.getElementById("btnLogout").addEventListener("click", () => {
    sessionStorage.removeItem("usuarioActivo");
    window.location.href = "index.html";
  });

  // Recomendación nutricional con Puter.js
  document.getElementById("btnEnviar").addEventListener("click", async () => {
    const texto = document.getElementById("inputTexto").value;

    if (!texto.trim()) {
      resultadoDiv.innerText = "Por favor, escribe tus datos antes de enviar.";
      return;
    }

    resultadoDiv.innerText = "Generando recomendación... 🍏";

    try {
      const prompt = `
        Eres un nutricionista profesional. El usuario te da la siguiente información:
        "${texto}"
        Da una recomendación nutricional breve, clara y en español, considerando edad, peso, altura y nivel de actividad física.
      `;

      const response = await puter.ai.chat(prompt, { model: "gpt-5-nano" });
      resultadoDiv.innerText = response;
    } catch (error) {
      resultadoDiv.innerText = "Error al generar la recomendación: " + error.message;
    }
  });
});
