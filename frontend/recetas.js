document.addEventListener("DOMContentLoaded", () => {

    const apiKey = "568a9bd2915f4882abf2bf2f96181265"; //Comentario mio, es importante generar una key con diferentes cuentas pq cada una tiene 50 creditos

    // Elementos del DOM
    const btnBuscar = document.getElementById("btnBuscarRecetas");
    const recetasContainer = document.getElementById("recetasContainer");
    const filtroCalorias = document.getElementById("filtroCalorias");
    const filtroIngredientes = document.getElementById("filtroIngredientes");
    const filtroAlergias = document.getElementById("filtroAlergias");
    const plannerDias = document.querySelectorAll(".dia");
    const listaComprasDiv = document.getElementById("listaCompras");
    const btnGenerarLista = document.getElementById("btnGenerarLista");
    const btnLogout = document.getElementById("btnLogout");
    const btnRegresar = document.getElementById("btnRegresar");
    const btnExportarPDF = document.getElementById("btnExportarPDF");

    btnRegresar.addEventListener("click", () => {
        window.location.href = "app.html";
    });

    // Verificar sesión
    const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));
    if (!usuarioActivo) { 
        alert("Debes iniciar sesión"); 
        window.location.href = "index.html"; 
        return; 
    }

    // Cargar usuarios de localStorage
    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "{}");

    // Si usuario no existe en usuarios, inicializarlo
    if (!usuarios[usuarioActivo.email]) {
        usuarios[usuarioActivo.email] = { password: "", historial: [], planner: {} };
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }

    // Inicializar planner
    let planner = usuarios[usuarioActivo.email].planner || {
        "Lunes": [], "Martes": [], "Miércoles": [], "Jueves": [],
        "Viernes": [], "Sábado": [], "Domingo": []
    };

    let recetasBuscadas = [];

    // ---------------- Cargar planner guardado ----------------
    if (localStorage.getItem(`planner_${usuarioActivo.email}`)) {
        planner = JSON.parse(localStorage.getItem(`planner_${usuarioActivo.email}`));
    }
    mostrarPlanner();

    // ---------------- Buscar recetas ----------------
    btnBuscar.addEventListener("click", async () => {
        let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&number=12&addRecipeInformation=true`;
        if (filtroCalorias.value) url += `&maxCalories=${filtroCalorias.value}`;
        if (filtroIngredientes.value) url += `&includeIngredients=${encodeURIComponent(filtroIngredientes.value)}`;
        if (filtroAlergias.value) url += `&intolerances=${encodeURIComponent(filtroAlergias.value)}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            recetasBuscadas = data.results || [];
            mostrarRecetas();
        } catch (err) {
            recetasContainer.innerHTML = "Error: " + err.message;
        }
    });

    // ---------------- Mostrar recetas ----------------
    function mostrarRecetas() {
        recetasContainer.innerHTML = recetasBuscadas.map(r => `
            <div class="receta" draggable="true" data-id="${r.id}">
                <img src="${r.image}" alt="${r.title}">
                <h3>${r.title}</h3>
                <p>Calorías: ${r.nutrition?.nutrients?.find(n=>n.name==="Calories")?.amount || "N/A"}</p>
            </div>
        `).join("");

        document.querySelectorAll(".receta").forEach(div => div.addEventListener("dragstart", dragStart));
    }

    // ---------------- Drag & Drop ----------------
    function dragStart(e) { e.dataTransfer.setData("text/plain", e.target.dataset.id); }

    plannerDias.forEach(dia => {
        dia.addEventListener("dragover", e => e.preventDefault());
        dia.addEventListener("drop", e => {
            e.preventDefault();
            const recetaId = e.dataTransfer.getData("text/plain");
            const receta = recetasBuscadas.find(r => r.id == recetaId);
            if (receta) {
                planner[dia.dataset.dia].push(receta);
                guardarPlanner();
                mostrarPlanner();
            }
        });
    });

    // ---------------- Mostrar Planner ----------------
    function mostrarPlanner() {
        plannerDias.forEach(dia => {
            dia.innerHTML = `<h3>${dia.dataset.dia}</h3>` +
                planner[dia.dataset.dia].map((r, index) => `
                    <div class="recetaPlanner">
                        ${r.title}
                        <button data-dia="${dia.dataset.dia}" data-index="${index}">x</button>
                    </div>
                `).join("");
        });

        document.querySelectorAll(".recetaPlanner button").forEach(btn => {
            btn.addEventListener("click", e => {
                const dia = e.target.dataset.dia;
                const index = e.target.dataset.index;
                planner[dia].splice(index,1);
                guardarPlanner();
                mostrarPlanner();
            });
        });
    }

    // ---------------- Guardar Planner ----------------
    function guardarPlanner() {
        localStorage.setItem(`planner_${usuarioActivo.email}`, JSON.stringify(planner));
        usuarios[usuarioActivo.email].planner = planner;
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }

    // ---------------- Lista de compras optimizada ----------------
    btnGenerarLista.addEventListener("click", async () => {
        listaComprasDiv.innerHTML = "<h3>Generando lista de compras...</h3>";
        let listaHTML = "";

        for (const dia of Object.keys(planner)) {
            if (planner[dia].length === 0) continue;
            listaHTML += `<h3 class="diaLista">${dia}</h3>`;

            const promesasRecetas = planner[dia].map(async receta => {
                try {
                    const res = await fetch(`https://api.spoonacular.com/recipes/${receta.id}/information?apiKey=${apiKey}`);
                    const data = await res.json();
                    let ingredientesHTML = "<ul>";
                    if (data.extendedIngredients && data.extendedIngredients.length > 0) {
                        data.extendedIngredients.forEach(ing => {
                            ingredientesHTML += `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`;
                        });
                    } else ingredientesHTML += "<li>No se encontraron ingredientes.</li>";
                    ingredientesHTML += "</ul>";
                    return `<h4 class="recetaLista">${receta.title}</h4>${ingredientesHTML}`;
                } catch(err) {
                    return `<h4 class="recetaLista">${receta.title}</h4><p>Error: ${err.message}</p>`;
                }
            });

            const resultadosDia = await Promise.all(promesasRecetas);
            listaHTML += resultadosDia.join("");
        }

        listaComprasDiv.innerHTML = `<h3>Lista de Compras Detallada</h3>` + listaHTML;
        localStorage.setItem(`${usuarioActivo.email}_listaCompras`, listaComprasDiv.innerHTML);
    });

    // ---------------- Cargar lista guardada ----------------
    const listaGuardada = localStorage.getItem(`${usuarioActivo.email}_listaCompras`);
    if (listaGuardada) listaComprasDiv.innerHTML = listaGuardada;

    // ---------------- Logout ----------------
    btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("usuarioActivo");
        window.location.href = "index.html";
    });

    btnExportarPDF.addEventListener("click", async () => {
  if (!planner || Object.keys(planner).length === 0) {
    alert("No hay recetas en el plan semanal para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Informe de Plan Semanal y Lista de Compras", 14, 20);

  doc.setFontSize(12);
  doc.text("Plan Semanal", 14, 30);

  // Generar tabla del plan semanal
  const tableData = [];
  for (const [dia, recetas] of Object.entries(planner)) {
    if (recetas.length > 0) {
      tableData.push([dia.toUpperCase(), recetas.map(r => r.title).join(", ")]);
    } else {
      tableData.push([dia.toUpperCase(), "—"]);
    }
  }

  doc.autoTable({
    head: [["Día", "Recetas"]],
    body: tableData,
    startY: 35,
    theme: "striped",
    headStyles: { fillColor: [103, 58, 183] },
  });

  // Generar lista de compras
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text("Lista de Compras por Día", 14, y);

  y += 5;
  for (const [dia, recetas] of Object.entries(planner)) {
    if (recetas.length > 0) {
      doc.text(`\n${dia.toUpperCase()}`, 14, y);
      y += 12;

      for (const receta of recetas) {
        // Obtener detalles de la receta desde Spoonacular
        const response = await fetch(
          `https://api.spoonacular.com/recipes/${receta.id}/information?apiKey=` //Aqui poner la key de la API
        );
        const data = await response.json();

        doc.setFontSize(11);
        doc.text(`${receta.title}`, 20, y);
        y += 8;

        const ingredientes = data.extendedIngredients
          .map((ing) => `• ${ing.original}`)
          .join("\n");

        const lineas = doc.splitTextToSize(ingredientes, 170);
        doc.text(lineas, 25, y);
        y += lineas.length * 6;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      }
    }
  }

  doc.save("Plan_Semanal_y_Lista_Compras.pdf");
});


});

