const API_URL = "https://apipacientes.adsocartago.com";

let pacientes = [];
let idAEliminar = null;

// Referencias al DOM
const tablaBody = document.getElementById("tabla-pacientes");
const modalFormulario = document.getElementById("modal-formulario");
const modalEliminar = document.getElementById("modal-eliminar");
const formPaciente = document.getElementById("form-paciente");
const buscador = document.getElementById("buscador");
const btnGuardar = document.getElementById("btn-guardar");
const btnConfirmarEliminar = document.getElementById("btn-confirmar-eliminar");

document.addEventListener("DOMContentLoaded", () => {
  obtenerPacientes();
});

// Convierte "M"/"F"/"O" (o palabras) a etiqueta legible para la tabla
function etiquetaGenero(codigo) {
  if (!codigo) return "";
  const v = String(codigo).trim().toUpperCase();
  if (v === "F" || v.startsWith("FEM")) return "Femenino";
  if (v === "M" || v.startsWith("MAS")) return "Masculino";
  if (v === "O" || v.startsWith("OTR")) return "Otro";
  return codigo;
}

// Convierte cualquier valor a "M", "F" u "O" para el <select> y la API
function codigoGenero(valor) {
  if (!valor) return "";
  const v = String(valor).trim().toUpperCase();
  if (v === "F" || v.startsWith("FEM")) return "F";
  if (v === "M" || v.startsWith("MAS")) return "M";
  if (v === "O" || v.startsWith("OTR")) return "O";
  return "";
}

function extraerPaciente(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (typeof data === "object") {
    if (data.name !== undefined || data.diagnosis !== undefined) return data;
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (
        Array.isArray(val) &&
        val[0] &&
        (val[0].name !== undefined || val[0].diagnosis !== undefined)
      ) {
        return val[0];
      }
      if (
        val &&
        typeof val === "object" &&
        (val.name !== undefined || val.diagnosis !== undefined)
      ) {
        return val;
      }
    }
  }
  return null;
}

function rellenarCamposFormulario(paciente, idFallback) {
  document.getElementById("paciente-id").value =
    paciente.id ?? idFallback ?? "";
  document.getElementById("name").value = paciente.name ?? "";
  document.getElementById("age").value = paciente.age ?? "";
  document.getElementById("gender").value = codigoGenero(
    paciente.gender ?? paciente.genero ?? "",
  );
  document.getElementById("diagnosis").value =
    paciente.diagnosis ?? paciente.diagnostico ?? "";
}

// ==========================================
// 1. LISTAR PACIENTES (GET /api/listar.php)
// ==========================================
async function obtenerPacientes() {
  tablaBody.innerHTML = `
    <tr>
      <td colspan="6" class="py-10 text-center text-slate-400 text-sm">
        Cargando pacientes...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`${API_URL}/api/listar.php`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();

    const lista = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.datos)
          ? data.datos
          : [];

    pacientes = lista;
    renderizarTabla(pacientes);
  } catch (error) {
    console.error("Error al listar:", error);
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center text-rose-500 text-sm">
          No se pudieron cargar los pacientes. Revisa la consola o la conexión con la API.
        </td>
      </tr>
    `;
  }
}

// Renderizar filas en la tabla
function renderizarTabla(lista) {
  tablaBody.innerHTML = "";

  if (!lista.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center text-slate-400 text-sm">
          No se encontraron pacientes registrados.
        </td>
      </tr>
    `;
    return;
  }

  lista.forEach((p) => {
    const cod = codigoGenero(p.gender);
    const textoGenero = etiquetaGenero(p.gender);

    const badgeColor =
      cod === "F"
        ? "bg-purple-50 text-purple-700 ring-purple-600/20"
        : cod === "M"
          ? "bg-sky-50 text-sky-700 ring-sky-600/20"
          : "bg-amber-50 text-amber-700 ring-amber-600/20";

    const fila = document.createElement("tr");
    fila.className = "hover:bg-slate-50/90 transition-colors group";

    fila.innerHTML = `
      <td class="py-4 px-6 font-medium text-slate-400">#${p.id}</td>
      <td class="py-4 px-6 font-semibold text-slate-800">${p.name}</td>
      <td class="py-4 px-6 text-slate-600">${p.age} años</td>
      <td class="py-4 px-6">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${badgeColor}">
          ${textoGenero}
        </span>
      </td>
      <td class="py-4 px-6 text-slate-600 max-w-xs truncate" title="${p.diagnosis}">
        ${p.diagnosis}
      </td>
      <td class="py-4 px-6 text-right">
        <div class="inline-flex items-center gap-1.5">
          <button onclick="abrirModalEditar(${p.id})" title="Editar"
            class="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button onclick="abrirModalEliminar(${p.id}, '${String(p.name).replace(/'/g, "\\'")}')" title="Eliminar"
            class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </td>
    `;
    tablaBody.appendChild(fila);
  });
}

// ==========================================
// 2. MODALES CREAR / VER / ACTUALIZAR
// ==========================================
function abrirModalCrear() {
  formPaciente.reset();
  document.getElementById("paciente-id").value = "";
  document.getElementById("modal-titulo").textContent =
    "Registrar Nuevo Paciente";
  btnGuardar.textContent = "Guardar Paciente";

  modalFormulario.classList.remove("hidden");
  modalFormulario.classList.add("flex");
}

// Consulta GET /api/ver.php?id=... (con respaldo en memoria)
async function abrirModalEditar(id) {
  formPaciente.reset();
  document.getElementById("paciente-id").value = id;
  document.getElementById("modal-titulo").textContent = "Actualizar Paciente";
  btnGuardar.textContent = "Guardar Cambios";

  const pacienteLocal = pacientes.find((p) => String(p.id) === String(id));
  if (pacienteLocal) {
    rellenarCamposFormulario(pacienteLocal, id);
  }

  modalFormulario.classList.remove("hidden");
  modalFormulario.classList.add("flex");

  try {
    const res = await fetch(
      `${API_URL}/api/ver.php?id=${encodeURIComponent(id)}`,
    );
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    const pacienteRemoto = extraerPaciente(data);

    if (pacienteRemoto) {
      rellenarCamposFormulario(pacienteRemoto, id);
    } else if (!pacienteLocal) {
      throw new Error("No se encontraron datos del paciente en la respuesta");
    }
  } catch (error) {
    console.warn("Aviso al consultar /api/ver.php:", error);
    if (!pacienteLocal) {
      alert("No se pudo cargar la información del paciente.");
      cerrarModalFormulario();
    }
  }
}

function cerrarModalFormulario() {
  modalFormulario.classList.add("hidden");
  modalFormulario.classList.remove("flex");
}

// Enviar formulario a POST /api/crear.php o POST /api/actualizar.php
formPaciente.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("paciente-id").value;
  const payload = {
    name: document.getElementById("name").value.trim(),
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    diagnosis: document.getElementById("diagnosis").value.trim(),
  };

  const esEdicion = Boolean(id);
  const endpoint = esEdicion
    ? `${API_URL}/api/actualizar.php`
    : `${API_URL}/api/crear.php`;
  const bodyData = esEdicion ? { id: Number(id), ...payload } : payload;

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    const textoRespuesta = await res.text();
    let jsonRespuesta = null;
    try {
      jsonRespuesta = JSON.parse(textoRespuesta);
    } catch (_) {}

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${textoRespuesta}`);
    }

    if (jsonRespuesta && jsonRespuesta.exito === false) {
      const detalle = Array.isArray(jsonRespuesta.datos)
        ? jsonRespuesta.datos.join(", ")
        : jsonRespuesta.mensaje || textoRespuesta;
      throw new Error(detalle);
    }

    cerrarModalFormulario();
    await obtenerPacientes();
  } catch (error) {
    console.error("Error detallado al guardar:", error);
    alert(`Error al guardar: ${error.message}`);
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = esEdicion ? "Guardar Cambios" : "Guardar Paciente";
  }
});

// ==========================================
// 3. MODAL Y PETICIÓN ELIMINAR (POST /api/eliminar.php)
// ==========================================
function abrirModalEliminar(id, nombre) {
  idAEliminar = id;
  document.getElementById("nombre-eliminar").textContent = nombre;
  modalEliminar.classList.remove("hidden");
  modalEliminar.classList.add("flex");
}

function cerrarModalEliminar() {
  idAEliminar = null;
  modalEliminar.classList.add("hidden");
  modalEliminar.classList.remove("flex");
}

btnConfirmarEliminar.addEventListener("click", async () => {
  if (idAEliminar === null) return;

  btnConfirmarEliminar.disabled = true;
  btnConfirmarEliminar.textContent = "Eliminando...";

  try {
    const res = await fetch(`${API_URL}/api/eliminar.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: Number(idAEliminar) }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    cerrarModalEliminar();
    await obtenerPacientes();
  } catch (error) {
    console.error("Error al eliminar:", error);
    alert("No se pudo eliminar el paciente.");
  } finally {
    btnConfirmarEliminar.disabled = false;
    btnConfirmarEliminar.textContent = "Sí, eliminar";
  }
});

// ==========================================
// BUSCADOR EN VIVO Y TECLA ESC
// ==========================================
buscador.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase().trim();
  const filtrados = pacientes.filter(
    (p) =>
      String(p.id || "")
        .toLowerCase()
        .includes(texto) ||
      String(p.name || "")
        .toLowerCase()
        .includes(texto) ||
      String(p.diagnosis || "")
        .toLowerCase()
        .includes(texto),
  );
  renderizarTabla(filtrados);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModalFormulario();
    cerrarModalEliminar();
  }
});
