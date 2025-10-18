document.getElementById("btnEnviar").addEventListener("click", async () => {
    const texto = document.getElementById("inputTexto").value;
    const resultadoDiv = document.getElementById("resultado");

    if (!texto.trim()) {
        resultadoDiv.innerText = "Por favor, escribe tus datos antes de enviar.";
        return;
    }

    // Mensaje de carga
    resultadoDiv.innerText = "Generando recomendación... 🍏";

    try {
        const prompt = `
        Eres un nutricionista profesional. El usuario te da la siguiente información:
        "${texto}"
        Da una recomendación nutricional breve, clara y en español, considerando edad, peso, altura, y nivel de actividad física.
        `;

        // Llamada a Puter.js usando GPT-5 nano 
        const response = await puter.ai.chat(prompt, { model: "gpt-5-nano" });

        resultadoDiv.innerText = response;
    } catch (error) {
        resultadoDiv.innerText = "Error al generar la recomendación: " + error.message;
    }
});
