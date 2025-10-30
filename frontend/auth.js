// auth.js
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("formLogin");
  const mensaje = document.getElementById("mensaje");

  // Si hay sesion activa, ir a la app
  const sesion = sessionStorage.getItem("usuarioActivo");
  if (sesion) {
    window.location.href = "app.html";
    return;
  }

  // Registro / login local
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      mensaje.innerText = "Por favor, completa todos los campos.";
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
    const existente = usuarios.find(u => u.email === email);

    if (existente) {
      // Inicio de sesión
      if (existente.password === password) {
        sessionStorage.setItem("usuarioActivo", JSON.stringify(existente));
        mensaje.innerText = "Inicio de sesión exitoso ✅";
        setTimeout(() => window.location.href = "app.html", 800);
      } else {
        mensaje.innerText = "Contraseña incorrecta ❌";
      }
    } else {
      // Registro nuevo
      const nuevo = { email, password, fechaRegistro: new Date().toISOString(), metodo: "local" };
      usuarios.push(nuevo);
      localStorage.setItem("usuarios", JSON.stringify(usuarios));
      sessionStorage.setItem("usuarioActivo", JSON.stringify(nuevo));
      mensaje.innerText = "Cuenta creada exitosamente ✅";
      setTimeout(() => window.location.href = "app.html", 800);
    }
  });
});
