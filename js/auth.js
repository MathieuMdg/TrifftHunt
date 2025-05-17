let isSignup = false;

    const formTitle = document.getElementById("form-title");
    const usernameGroup = document.getElementById("username-group");
    const toggleText = document.getElementById("toggle-text");
    const toggleLink = document.getElementById("toggle-link");
    const submitBtn = document.getElementById("submit-btn");
    const form = document.getElementById("auth-form");

    toggleLink.addEventListener("click", () => {
      isSignup = !isSignup;
      formTitle.textContent = isSignup ? "Inscription" : "Connexion";
      submitBtn.textContent = isSignup ? "S'inscrire" : "Se connecter";
      toggleText.textContent = isSignup ? "Déjà un compte ? " : "Pas encore de compte ? ";
      toggleLink.textContent = isSignup ? "Connexion" : "Inscription";
      usernameGroup.style.display = isSignup ? "block" : "none";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const username = document.getElementById("username").value;

      const users = JSON.parse(localStorage.getItem("users")) || {};

      if (isSignup) {
        if (users[email]) {
          alert("❌ Cet email est déjà utilisé.");
          return;
        }
        users[email] = {
          username: username,
          password: password,
        };
        localStorage.setItem("users", JSON.stringify(users));
        alert("✅ Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        toggleLink.click(); // repasser en mode connexion
      } else {
        const user = users[email];
        if (!user || user.password !== password) {
          alert("❌ Email ou mot de passe incorrect.");
          return;
        }
        alert(`✅ Bienvenue, ${user.username} !`);
        // Après authentification réussie (connexion)
          localStorage.setItem('connectedUser', JSON.stringify({
          email: email,
          username: user.username
        }));

        // Puis redirection vers la carte
        window.location.href = 'carte.html';
      }

      form.reset();
    });