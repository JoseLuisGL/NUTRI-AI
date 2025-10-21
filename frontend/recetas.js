document.addEventListener("DOMContentLoaded", () => {

    const apiKey = ""; //Comentario mio, es importante generar una key con diferentes cuentas pq cada una tiene 50 creditos

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

});
