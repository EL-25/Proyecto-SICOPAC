document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Por ahora solo mostramos en consola
  console.log("Usuario:", username);
  console.log("Contraseña:", password);

  // Aquí luego se conectará con el backend
  alert("Login enviado (simulado)");
});