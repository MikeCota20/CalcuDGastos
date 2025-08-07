
const cargarEstado = () => JSON.parse(localStorage.getItem('gastos')) || [];
const guardarEstado = (estado) => localStorage.setItem('gastos', JSON.stringify(estado));

const cargarPresupuesto = () => parseFloat(localStorage.getItem('presupuesto')) || 0;
const guardarPresupuesto = (valor) => localStorage.setItem('presupuesto', valor);

// -------- TEMA --------
const cargarTema = () => localStorage.getItem('tema') || 'cyberpunk';
const guardarTema = (tema) => localStorage.setItem('tema', tema);
document.body.className = cargarTema();

document.getElementById('btn-tema').addEventListener('click', () => {
  const nuevoTema = document.body.classList.contains('cyberpunk') ? 'claro' : 'cyberpunk';
  document.body.className = nuevoTema;
  guardarTema(nuevoTema);
});


let estado = cargarEstado();
let presupuesto = cargarPresupuesto();
let filtros = { categoria: "", ordenPrecio: "" };


const gastosReducer = (state, action) => {
  switch (action.type) {
    case 'AGREGAR_GASTO': return [...state, action.payload];
    case 'ELIMINAR_GASTO': return state.filter(g => g.id !== action.payload);
    default: return state;
  }
};

const crearGasto = (descripcion, cantidad, categoria) => ({
  id: Date.now(),
  descripcion,
  cantidad,
  categoria,
  fecha: new Date().toLocaleDateString()
});

const renderGastos = (gastos) =>
  gastos.map(g =>
    `<li>
      <div>
        <strong>${g.descripcion}</strong> - $${g.cantidad} [${g.categoria}]
        <span class="fecha">(${g.fecha})</span>
      </div>
      <button data-id="${g.id}" class="eliminar">X</button>
    </li>`
  ).join('');

const calcularTotal = (gastos) =>
  gastos.reduce((total, g) => total + g.cantidad, 0);

const calcularPorCategoria = (gastos) => {
  return gastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.cantidad;
    return acc;
  }, {});
};

// -------- COLORES --------
const coloresCategorias = {
  "Alimento": "#00e5ff",
  "Transporte": "#008cff",
  "Ocio": "#00ffaa",
  "Servicios": "#0077ff",
  "Otros": "#00ccff"
};

const renderResumen = (resumen, total) => 
  Object.entries(resumen)
    .map(([categoria, monto]) => {
      const porcentaje = total > 0 ? (monto / total) * 100 : 0;
      const color = coloresCategorias[categoria] || "#00e5ff";
      return `
        <li>
          ${categoria}: $${monto.toFixed(2)} (${porcentaje.toFixed(1)}%)
          <div class="barra-container">
            <div class="barra" style="width:${porcentaje}%; background:${color};"></div>
          </div>
        </li>`;
    }).join('');


const memoize = (fn) => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    return cache[key] || (cache[key] = fn(...args));
  };
};
const calcularTotalMemo = memoize(calcularTotal);
const calcularPorCategoriaMemo = memoize(calcularPorCategoria);


const aplicarFiltros = (gastos, filtros) => {
  let filtrados = gastos;
  if (filtros.categoria) filtrados = filtrados.filter(g => g.categoria === filtros.categoria);
  if (filtros.ordenPrecio === "asc") filtrados = [...filtrados].sort((a, b) => a.cantidad - b.cantidad);
  if (filtros.ordenPrecio === "desc") filtrados = [...filtrados].sort((a, b) => b.cantidad - a.cantidad);
  return filtrados;
};

// -------- RENDERIZADO DECLARATIVO --------
const actualizarUI = () => {
  const gastosFiltrados = aplicarFiltros(estado, filtros);
  const total = calcularTotalMemo(gastosFiltrados);


  document.getElementById('lista-gastos').innerHTML = renderGastos(gastosFiltrados);
  document.getElementById('total').textContent = total.toFixed(2);
  document.getElementById('lista-resumen').innerHTML = renderResumen(calcularPorCategoriaMemo(gastosFiltrados), total);


  document.getElementById('presupuesto-actual').textContent = presupuesto.toFixed(2);
  const restante = Math.max(presupuesto - total, 0);
  document.getElementById('presupuesto-restante').textContent = restante.toFixed(2);


  const porcentaje = presupuesto > 0 ? (restante / presupuesto) * 100 : 0;
  const barraPresupuesto = document.getElementById('barra-presupuesto');
  barraPresupuesto.style.width = `${porcentaje}%`;

  if (porcentaje > 50) {
    barraPresupuesto.style.background = "#00ff99"; // verde
  } else if (porcentaje > 20) {
    barraPresupuesto.style.background = "#ffcc00"; // amarillo
  } else {
    barraPresupuesto.style.background = "#ff0033"; // rojo
  }


  guardarEstado(estado);
  guardarPresupuesto(presupuesto);
};

// -------- EVENTOS --------
document.getElementById('form-gasto').addEventListener('submit', (e) => {
  e.preventDefault();
  const descripcion = document.getElementById('descripcion').value.trim();
  const cantidad = parseFloat(document.getElementById('cantidad').value);
  const categoria = document.getElementById('categoria').value;
  if (!descripcion || isNaN(cantidad) || !categoria) return;
  const nuevo = crearGasto(descripcion, cantidad, categoria);
  estado = gastosReducer(estado, { type: 'AGREGAR_GASTO', payload: nuevo });
  actualizarUI();
  e.target.reset();
});

document.getElementById('lista-gastos').addEventListener('click', (e) => {
  if (e.target.classList.contains('eliminar')) {
    const id = parseInt(e.target.dataset.id);
    estado = gastosReducer(estado, { type: 'ELIMINAR_GASTO', payload: id });
    actualizarUI();
  }
});

['filtro-categoria', 'filtro-precio'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    filtros.categoria = document.getElementById('filtro-categoria').value;
    filtros.ordenPrecio = document.getElementById('filtro-precio').value;
    actualizarUI();
  });
});


document.getElementById('form-presupuesto').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = parseFloat(document.getElementById('presupuesto-valor').value);
  if (isNaN(val) || val < 0) return;
  presupuesto = val;
  actualizarUI();
  e.target.reset();
});

actualizarUI();
