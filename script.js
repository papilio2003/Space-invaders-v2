const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const game = document.getElementById("game");

const nave = document.getElementById("nave");

const explosion = document.getElementById("explosion");
const shootSound = document.getElementById("shootSound");
const damageSound = document.getElementById("damageSound");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");
const timerSound = document.getElementById("timerSound");

const musicaFondo = new Audio("audios/background.mp3");
musicaFondo.loop = true;
musicaFondo.addEventListener("ended", () => {
  musicaFondo.currentTime = 0;
  musicaFondo.play();
});
musicaFondo.volume = 0.5;

const boostImg = new Image();
boostImg.src = "imgs/boost.png";

const scoreElement = document.getElementById("score");
const vidasContainer = document.getElementById("vidas");

const quizModal = document.getElementById("quizModal");
const preguntaElemento = document.getElementById("pregunta");
const opcionesElemento = document.getElementById("opciones");
const timerElemento = document.getElementById("timer");

const endScreen = document.getElementById("endScreen");
const resultadoTitulo = document.getElementById("resultadoTitulo");
const finalScore = document.getElementById("finalScore");
const finalPreguntas = document.getElementById("finalPreguntas");
const finalCorrectas = document.getElementById("finalCorrectas");
const restartBtn = document.getElementById("restartBtn");
const boostElement = document.getElementById("boost");

let cambiandoNivel = false;
let boss = null;
let bossVida = 0;
let bossVidaMax = 0;
let enBoss = false;
let bossDireccion = 1;

let golpesBossDesdeBoost = 0;

let score = 0;
let vidas = 5;

let balas = [];
let balasEnemigas = [];

let juegoIniciado = false;
let juegoPausado = false;
let respondiendo = false;
let juegoTerminado = false;

let tipoPreguntaActual = null;
let nivelPendiente = false;

let puedeDisparar = true;
const COOLDOWN_DISPARO = 300;

let formacion = [];
let filas = 5;
let columnas = 10;

let direccion = 1;
let velocidadX = 1.5;
let bajada = 20;

let LIMITE_BAJADA_ENEMIGOS = window.innerHeight - 430;
const VELOCIDAD_DISPARO_ENEMIGO = 450;

let intervaloQuiz;
let tiempoRestante = 10;
let intervaloDisparoEnemigo;

let preguntas = [];
let preguntasDisponibles = [];
let preguntasTotales = 0;
let preguntasCorrectas = 0;

let nivel = 1;
let enemigosEliminados = 0;

let boostActual = null;
let boostsGeneradosNivel = 0;
const MAX_BOOSTS_POR_NIVEL = 2;
let boostBossSoltado = false;

let inmunidadActiva = false;
let timeoutInmunidad = null;

const spritesEnemigos = [
  "https://framerusercontent.com/images/gAkgciSiY2TXZDc1Yyzj74GUXDY.gif",
  "https://images.emojiterra.com/google/noto-emoji/animated-emoji/1f47e.gif",
  "https://www.educaciontrespuntocero.com/wp-content/uploads/2016/03/si-px.gif",
  "https://www.sdjv72.fr/wp-content/uploads/2019/02/SIDEF.gif",
  "https://images.squarespace-cdn.com/content/v1/5fba58582c9d4143d9022adf/768b567b-e1c0-42d9-8d94-aefe7886334c/Gorf-2.gif",
];

function reproducirAudio(audio) {
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.play();
}

function detenerTodosLosAudios() {
  const audios = [shootSound, explosion, correctSound, wrongSound, timerSound];

  audios.forEach((audio) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}

async function cargarPreguntas() {
  try {
    const res = await fetch("./preguntas.json");
    preguntas = await res.json();
    preguntasDisponibles = [...preguntas];

    console.log("Preguntas cargadas:", preguntas);
  } catch (error) {
    console.error("Error cargando preguntas:", error);
  }
}

document.body.classList.add("menu-bg");

document.addEventListener(
  "click",
  () => {
    if (musicaFondo.paused) {
      musicaFondo.play();
    }
  },
  { once: true }
);

startBtn.addEventListener("click", async () => {
  await cargarPreguntas();

  menu.style.display = "none";
  game.classList.remove("hidden");

  document.body.classList.remove("menu-bg");
  document.body.classList.add("game-bg");

  iniciarJuego();
});

function iniciarDisparosEnemigos() {
  clearInterval(intervaloDisparoEnemigo);

  intervaloDisparoEnemigo = setInterval(
    disparoEnemigo,
    VELOCIDAD_DISPARO_ENEMIGO
  );
}

function detenerDisparosEnemigos() {
  clearInterval(intervaloDisparoEnemigo);
}

function perderVidaPorDisparo() {
  if (inmunidadActiva) return;

  crearExplosion(nave.offsetLeft + 15, nave.offsetTop + 15);
  reproducirAudio(explosion);

  vidas--;
  actualizarVidas();
  reproducirAudio(damageSound);

  if (vidas <= 0) {
    finalizarJuego(false);
  }
}

function crearBoost() {
  if (boostActual || !boostElement) return;

  boostActual = boostElement;

  boostActual.x = Math.random() * (window.innerWidth - 90) + 45;
  boostActual.y = 40;

  boostActual.style.transform = `translate3d(${boostActual.x}px, ${boostActual.y}px, 0)`;

  requestAnimationFrame(() => {
    boostActual.classList.remove("hidden");
  });
}

function ocultarBoost() {
  if (!boostActual) return;

  boostActual.classList.add("hidden");
  boostActual = null;
}

function activarInmunidad() {
  inmunidadActiva = true;
  nave.classList.add("inmune");

  clearTimeout(timeoutInmunidad);

  timeoutInmunidad = setTimeout(() => {
    inmunidadActiva = false;
    nave.classList.remove("inmune");
  }, 10000);
}

function iniciarJuego() {
  if (window.innerWidth < 700) {
  filas = 4;
  columnas = 7;
}
  if (juegoIniciado) return;

  juegoIniciado = true;

  if (musicaFondo.paused) {
    musicaFondo.play();
  }

  actualizarScore();
  actualizarVidas();
  mostrarTextoNivel();
  crearFormacion();
  iniciarDisparosEnemigos();
  gameLoop();
}

document.addEventListener("mousemove", (e) => {
  if (!juegoIniciado || juegoPausado) return;

  nave.style.left = e.clientX - nave.offsetWidth / 2 + "px";
});

document.addEventListener("click", () => {
  if (!quizModal.classList.contains("hidden")) return;
  if (!juegoIniciado || !puedeDisparar || juegoPausado) return;

  puedeDisparar = false;

  setTimeout(() => {
    puedeDisparar = true;
  }, COOLDOWN_DISPARO);

  const bala = document.createElement("div");
  bala.classList.add("bala", "bala-jugador");

  bala.x = nave.offsetLeft + nave.offsetWidth / 2;
  bala.y = nave.offsetTop;

  bala.style.left = bala.x + "px";
  bala.style.top = bala.y + "px";

  game.appendChild(bala);
  balas.push(bala);

  reproducirAudio(shootSound);
});

function crearFormacion() {
  formacion = [];

  const anchoPantalla = window.innerWidth;
  const altoPantalla = window.innerHeight;

  let totalEnemigos = filas * columnas;

  if (anchoPantalla < 700) {
    totalEnemigos = Math.min(totalEnemigos, 18);
  }

  const enemigoSize = anchoPantalla < 700 ? 40 : 50;
  const margenX = anchoPantalla < 700 ? 25 : 80;
  const espacioDisponible = anchoPantalla - margenX * 2;

  const columnasResponsivas = anchoPantalla < 700
    ? Math.min(6, Math.floor(espacioDisponible / (enemigoSize + 18)))
    : columnas;

  const filasResponsivas = Math.ceil(totalEnemigos / columnasResponsivas);

  const anchoFormacion =
    (columnasResponsivas - 1) * (enemigoSize + 18) + enemigoSize;

  const inicioX = Math.max(20, (anchoPantalla - anchoFormacion) / 2);
  const inicioY = altoPantalla < 700 ? 120 : 80;

  const separacionX = enemigoSize + 18;
  const separacionY = anchoPantalla < 700 ? 46 : 55;

  let enemigosCreados = 0;

  for (let fila = 0; fila < filasResponsivas; fila++) {
    for (let col = 0; col < columnasResponsivas; col++) {
      if (enemigosCreados >= totalEnemigos) return;

      const enemigo = document.createElement("div");
      enemigo.classList.add("enemigo");

      enemigo.x = inicioX + col * separacionX;
      enemigo.baseY = inicioY + fila * separacionY;
      enemigo.y = enemigo.baseY;

      enemigo.waveOffset = Math.random() * Math.PI * 2;

      enemigo.style.left = enemigo.x + "px";
      enemigo.style.top = enemigo.y + "px";

      const sprite =
        spritesEnemigos[Math.floor(Math.random() * spritesEnemigos.length)];

      enemigo.style.backgroundImage = `url(${sprite})`;

      game.appendChild(enemigo);
      formacion.push(enemigo);

      enemigosCreados++;
    }
  }
}

function moverFormacion() {
  let tocarBorde = false;
  const tiempo = Date.now() * 0.004;
  const velocidadActual = window.innerWidth < 700 ? 0.8 : velocidadX;

  formacion.forEach((enemigo) => {
    enemigo.x += velocidadActual * direccion;
    enemigo.y = enemigo.baseY + Math.sin(tiempo + enemigo.waveOffset) * 5;

    if (enemigo.x <= 20 || enemigo.x >= window.innerWidth - 60) {
      tocarBorde = true;
    }
  });

  if (tocarBorde) {
    direccion *= -1;

    formacion.forEach((enemigo) => {
      if (enemigo.baseY + bajada < LIMITE_BAJADA_ENEMIGOS) {
        enemigo.baseY += window.innerWidth < 700 ? 8 : bajada;
      }
    });
  }

  formacion.forEach((enemigo) => {
    enemigo.x = Math.max(20, Math.min(enemigo.x, window.innerWidth - 60));
    enemigo.style.left = enemigo.x + "px";
    enemigo.style.top = enemigo.y + "px";
  });
}

function disparoEnemigo() {
  if (juegoPausado || juegoTerminado) return;

  let atacante = null;

  if (enBoss && boss) {
    atacante = boss;
  } else if (formacion.length > 0) {
    atacante = formacion[Math.floor(Math.random() * formacion.length)];
  }

  if (!atacante) return;

  const bala = document.createElement("div");
  bala.classList.add("bala", "bala-enemiga");

  bala.x = atacante.x + 25;
  bala.y = atacante.y + 50;

  bala.style.left = bala.x + "px";
  bala.style.top = bala.y + "px";

  game.appendChild(bala);
  balasEnemigas.push(bala);
}

function crearExplosion(x, y) {
  const exp = document.createElement("div");
  exp.classList.add("explosion");

  exp.style.left = x + "px";
  exp.style.top = y + "px";

  game.appendChild(exp);

  setTimeout(() => {
    exp.remove();
  }, 300);
}

function crearBoss() {
  if (boss || enBoss) return;

  enBoss = true;
  detenerDisparosEnemigos();

  boss = document.createElement("div");
  boss.classList.add("boss");

  if (nivel >= 5) {
    boss.classList.add("final-boss");
  }

  const imagenBosses = {
    1: "./imgs/boss-lvl-1.png",
    2: "./imgs/boss-lvl-2.png",
    3: "./imgs/boss-lvl-3.png",
    4: "./imgs/boss-lvl-4.png",
    5: "./imgs/final-boss.png",
  };

  const imagenBoss = imagenBosses[nivel] || imagenBosses[5];
  boss.style.backgroundImage = `url("${imagenBoss}")`;

  boss.size = nivel >= 5 ? 250 : 160;
  boss.x = window.innerWidth / 2 - boss.size / 2;
  boss.y = 70;

  boss.velX = (1.4 + nivel * 0.25) * (Math.random() < 0.5 ? -1 : 1);
  boss.velY = (0.6 + nivel * 0.12) * (Math.random() < 0.5 ? -1 : 1);

  golpesBossDesdeBoost = 0;
  boss.cambioMovimiento = 0;

  boss.style.left = boss.x + "px";
  boss.style.top = boss.y + "px";

  game.appendChild(boss);

  bossVidaMax = 18 + nivel * 12;

  if (nivel >= 5) {
    bossVidaMax = 130;
  }

  bossVida = bossVidaMax;
  boostBossSoltado = false;

  crearBarraBoss();
  iniciarDisparosEnemigos();
}

function crearBarraBoss() {
  const barraExistente = document.getElementById("bossBar");

  if (barraExistente) {
    barraExistente.remove();
  }

  const barra = document.createElement("div");
  barra.id = "bossBar";

  const vida = document.createElement("div");
  vida.id = "bossVida";

  barra.appendChild(vida);
  document.body.appendChild(barra);

  actualizarBarraBoss();
}

function actualizarBarraBoss() {
  const vida = document.getElementById("bossVida");

  if (!vida) return;

  const porcentaje = Math.max((bossVida / bossVidaMax) * 100, 0);
  vida.style.width = porcentaje + "%";
}

function moverBoss() {
  if (!boss) return;

  boss.cambioMovimiento++;

  if (boss.cambioMovimiento > 45 || Math.random() < 0.015) {
    boss.velX = (1.5 + nivel * 0.3) * (Math.random() < 0.5 ? -1 : 1);
    boss.velY = (0.7 + nivel * 0.15) * (Math.random() < 0.5 ? -1 : 1);
    boss.cambioMovimiento = 0;
  }

  boss.x += boss.velX;
  boss.y += boss.velY;

  if (boss.x <= 20) {
    boss.x = 20;
    boss.velX *= -1;
  }

  if (boss.x >= window.innerWidth - boss.size - 20) {
    boss.x = window.innerWidth - boss.size - 20;
    boss.velX *= -1;
  }

  if (boss.y <= 60) {
    boss.y = 60;
    boss.velY *= -1;
  }

  if (boss.y >= 230) {
    boss.y = 230;
    boss.velY *= -1;
  }

  boss.style.left = boss.x + "px";
  boss.style.top = boss.y + "px";
}

function dañarBoss() {
  bossVida--;
  golpesBossDesdeBoost++;

  actualizarBarraBoss();

  if (golpesBossDesdeBoost >= 10 && !boostActual) {
    crearBoost();
    golpesBossDesdeBoost = 0;
  }

  if (bossVida <= 0) {
    destruirBoss();
  }
}

function destruirBoss() {
  if (!boss) return;

  crearExplosion(boss.x + boss.size / 2 - 25, boss.y + boss.size / 2 - 25);

  boss.remove();
  boss = null;
  enBoss = false;

  const barra = document.getElementById("bossBar");

  if (barra) {
    barra.remove();
  }

  ocultarBoost();

  balas.forEach((bala) => bala.remove());
  balasEnemigas.forEach((bala) => bala.remove());

  balas = [];
  balasEnemigas = [];

  if (nivel >= 5) {
    finalizarJuego(true);
    return;
  }

  pausarParaPregunta("vidaExtra");
}

function mostrarTextoNivel() {
  const texto = document.createElement("div");
  texto.classList.add("nivelTexto");
  texto.textContent = "NIVEL " + nivel;

  document.body.appendChild(texto);

  setTimeout(() => {
    texto.remove();
  }, 1800);
}

function pausarParaPregunta(tipo) {
  if (!preguntas || preguntas.length === 0) {
    console.error("No hay preguntas cargadas. Revisa preguntas.json y Live Server.");

    if (tipo === "vidaExtra") {
      subirNivel();
    }

    return;
  }

  if (!preguntasDisponibles || preguntasDisponibles.length === 0) {
    preguntasDisponibles = [...preguntas];
  }

  if (!preguntasDisponibles || preguntasDisponibles.length === 0) {
    console.error("No hay preguntas disponibles.");
    return;
  }

  tipoPreguntaActual = tipo;
  preguntasTotales++;
  juegoPausado = true;
  respondiendo = false;

  detenerDisparosEnemigos();

  if (shootSound) {
    shootSound.pause();
    shootSound.currentTime = 0;
  }

  const indice = Math.floor(Math.random() * preguntasDisponibles.length);
  const pregunta = preguntasDisponibles.splice(indice, 1)[0];

  if (tipo === "vidaExtra") {
    preguntaElemento.textContent =
      "Pregunta de recuperación: si contestas correctamente recuperas una vida.\n\n" +
      pregunta.pregunta;
  } else {
    preguntaElemento.textContent = pregunta.pregunta;
  }

  opcionesElemento.innerHTML = "";

  pregunta.opciones.forEach((opcion) => {
    const btn = document.createElement("button");
    btn.textContent = opcion;

    btn.addEventListener("click", () => {
      responder(opcion, pregunta.respuesta);
    });

    opcionesElemento.appendChild(btn);
  });

  quizModal.classList.remove("hidden");
  quizModal.style.display = "flex";

  iniciarTimerPregunta();
}

function iniciarTimerPregunta() {
  clearInterval(intervaloQuiz);

  tiempoRestante = 10;
  timerElemento.textContent = tiempoRestante;

  reproducirAudio(timerSound);

  intervaloQuiz = setInterval(() => {
    tiempoRestante--;
    timerElemento.textContent = tiempoRestante;

    if (tiempoRestante <= 0) {
      clearInterval(intervaloQuiz);
      reproducirAudio(wrongSound);
      procesarRespuestaPregunta(false);
    }
  }, 1000);
}

function responder(opcion, correcta) {
  if (respondiendo) return;

  respondiendo = true;
  clearInterval(intervaloQuiz);

  const botones = opcionesElemento.querySelectorAll("button");

  botones.forEach((btn) => {
    btn.disabled = true;

    if (btn.textContent === correcta) {
      btn.style.background = "green";
    } else if (btn.textContent === opcion) {
      btn.style.background = "red";
    }
  });

  const esCorrecta = opcion === correcta;
  procesarRespuestaPregunta(esCorrecta);
}

function procesarRespuestaPregunta(esCorrecta) {
  if (esCorrecta) {
    preguntasCorrectas++;
    reproducirAudio(correctSound);

    if (tipoPreguntaActual === "boost") {
      activarInmunidad();
    }

    if (tipoPreguntaActual === "vidaExtra") {
      if (vidas < 5) {
        vidas++;
        actualizarVidas();
      } else {
        activarInmunidad();
      }

      nivelPendiente = true;
    }
  } else {
    reproducirAudio(wrongSound);

    if (tipoPreguntaActual === "vidaExtra") {
      nivelPendiente = true;
    }
  }

  setTimeout(() => {
    cerrarModal();
  }, 800);
}

function cerrarModal() {
  quizModal.classList.add("hidden");
  quizModal.style.display = "none";

  if (timerSound) {
    timerSound.pause();
    timerSound.currentTime = 0;
  }

  clearInterval(intervaloQuiz);
  detenerDisparosEnemigos();

  setTimeout(() => {
    const debeSubirNivel = nivelPendiente;

    tipoPreguntaActual = null;
    nivelPendiente = false;
    juegoPausado = false;
    respondiendo = false;

    if (debeSubirNivel) {
      subirNivel();
    }

    if (!juegoTerminado) {
      iniciarDisparosEnemigos();
    }
  }, 500);
}

function finalizarJuego(gano) {
  juegoTerminado = true;
  juegoPausado = true;

  detenerDisparosEnemigos();
  detenerTodosLosAudios();

  const barraBoss = document.getElementById("bossBar");
  if (barraBoss) barraBoss.remove();

  if (boss) {
    boss.remove();
    boss = null;
  }

  enBoss = false;
  ocultarBoost();

  const endingGif = document.getElementById("endingGif");

  if (endingGif) {
    endingGif.src = gano ? "./imgs/ENDING.gif" : "./imgs/game over.gif";
  }

  endScreen.classList.remove("hidden");

  resultadoTitulo.textContent = gano ? "¡GANASTE!" : "GAME OVER";
  finalScore.textContent = "Puntaje: " + score;
  finalPreguntas.textContent = "Preguntas totales: " + preguntasTotales;
  finalCorrectas.textContent = "Correctas: " + preguntasCorrectas;
}

restartBtn.addEventListener("click", () => {
  location.reload();
});

function actualizarVidas() {
  const barras = vidasContainer.children;

  for (let i = 0; i < barras.length; i++) {
    if (i < vidas) {
      barras[i].classList.remove("perdida");
    } else {
      barras[i].classList.add("perdida");
    }
  }
}

function actualizarScore() {
  scoreElement.textContent = "SCORE: " + score + " | NIVEL: " + nivel;
}

function colision(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  return !(
    r1.top > r2.bottom ||
    r1.bottom < r2.top ||
    r1.right < r2.left ||
    r1.left > r2.right
  );
}

function subirNivel() {
  nivel++;

  if (window.innerWidth < 700) {
  filas = Math.min(4 + nivel, 6);
  columnas = Math.min(6 + nivel, 8);
} else {
  filas = Math.min(5 + nivel, 8);
  columnas = Math.min(10 + nivel, 14);
}
  velocidadX += 0.4;

  boostsGeneradosNivel = 0;
  boostBossSoltado = false;
  cambiandoNivel = false;

  ocultarBoost();

  if (boss) {
    boss.remove();
    boss = null;
  }

  enBoss = false;

  const barra = document.getElementById("bossBar");

  if (barra) {
    barra.remove();
  }

  formacion.forEach((enemigo) => enemigo.remove());
  balas.forEach((bala) => bala.remove());
  balasEnemigas.forEach((bala) => bala.remove());

  formacion = [];
  balas = [];
  balasEnemigas = [];

  direccion = 1;

  mostrarTextoNivel();
  crearFormacion();
  actualizarScore();
}

window.addEventListener("resize", () => {
  LIMITE_BAJADA_ENEMIGOS = window.innerHeight - 430;

  if (!juegoTerminado && !enBoss && formacion.length > 0) {
    formacion.forEach((enemigo) => enemigo.remove());
    formacion = [];

    if (window.innerWidth < 700) {
      filas = Math.min(4 + nivel, 6);
      columnas = Math.min(6 + nivel, 8);
    } else {
      filas = Math.min(5 + nivel, 8);
      columnas = Math.min(10 + nivel, 14);
    }

    crearFormacion();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    juegoPausado = true;
    detenerDisparosEnemigos();
  } else if (
    juegoIniciado &&
    !juegoTerminado &&
    quizModal.classList.contains("hidden")
  ) {
    juegoPausado = false;
    iniciarDisparosEnemigos();
  }
});

function gameLoop() {
  if (juegoTerminado) return;

  if (juegoPausado) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (enBoss) {
    moverBoss();
  } else {
    moverFormacion();
  }

  for (let i = balas.length - 1; i >= 0; i--) {
    const bala = balas[i];

    bala.y -= 10;
    bala.style.top = bala.y + "px";

    if (bala.y < 0) {
      bala.remove();
      balas.splice(i, 1);
    }
  }

  for (let i = balasEnemigas.length - 1; i >= 0; i--) {
    const bala = balasEnemigas[i];

    bala.y += 5;
    bala.style.top = bala.y + "px";

    if (colision(bala, nave)) {
      bala.remove();
      balasEnemigas.splice(i, 1);
      perderVidaPorDisparo();
      break;
    }

    if (bala.y > window.innerHeight) {
      bala.remove();
      balasEnemigas.splice(i, 1);
    }
  }

  for (let bi = balas.length - 1; bi >= 0; bi--) {
    if (boss && colision(balas[bi], boss)) {
      balas[bi].remove();
      balas.splice(bi, 1);

      dañarBoss();
      score += 5;
      actualizarScore();
      break;
    }

    for (let ei = formacion.length - 1; ei >= 0; ei--) {
      if (colision(balas[bi], formacion[ei])) {
        crearExplosion(formacion[ei].x, formacion[ei].y);

        if (explosion) {
          explosion.currentTime = 0;
          explosion.play();
        }

        formacion[ei].remove();
        balas[bi].remove();

        formacion.splice(ei, 1);
        balas.splice(bi, 1);

        score += 10;
        enemigosEliminados++;

        const enemigosRestantes = formacion.length;
        const enemigosTotalesNivel = filas * columnas;
        const puntoBoost1 = Math.floor(enemigosTotalesNivel * 0.33);
        const puntoBoost2 = Math.floor(enemigosTotalesNivel * 0.66);
        const enemigosMatadosNivel = enemigosTotalesNivel - enemigosRestantes;

        if (
          !boostActual &&
          boostsGeneradosNivel < MAX_BOOSTS_POR_NIVEL &&
          (enemigosMatadosNivel === puntoBoost1 ||
            enemigosMatadosNivel === puntoBoost2)
        ) {
          crearBoost();
          boostsGeneradosNivel++;
        }

        actualizarScore();
        break;
      }
    }
  }

  if (boostActual) {
    boostActual.y += window.innerWidth < 700 ? 2 : 3;
    boostActual.style.transform = `translate3d(${boostActual.x}px, ${boostActual.y}px, 0)`;

    if (colision(boostActual, nave)) {
      ocultarBoost();
      pausarParaPregunta("boost");
    } else if (boostActual.y > window.innerHeight) {
      ocultarBoost();
    }
  }

  if (
    formacion.length === 0 &&
    !enBoss &&
    !boss &&
    !cambiandoNivel &&
    tipoPreguntaActual === null &&
    !nivelPendiente
  ) {
    ocultarBoost();
    crearBoss();
  }

  requestAnimationFrame(gameLoop);
}