// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
const MAX_LAVADORAS = 5;
const FRANJAS_HORARIAS = ["09:00", "10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00", "18:00"];

let ticketActual = {
    numero: 1,
    fechaRecepcion: new Date(),
    fechaEntrega: '',
    horaEntrega: '',
    temperatura: '30 ºC',
    tipoRopa: 'Color',
    secado: 'NO'
};

// Objeto para llevar el registro de lavados por fecha y hora
// Ejemplo de estructura almacenada: { "28-07-2026": { "10:00": 3, "12:00": 5 } }
let registroOcupacion = {};

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarRegistroOcupacion();
    cargarNumeroTicket();
    establecerFechaEntregaDefecto();
    actualizarParrillaHoras();
    actualizarResumen();
});

function reiniciarContadorTicket() {
    if (confirm('¿Seguro que quieres reiniciar la numeración de tickets al #1?')) {
        localStorage.setItem('lavanderia_ultimo_ticket', 0);
        cargarNumeroTicket();
        alert('El contador se ha reiniciado correctamente al Ticket #1.');
    }
}

// Configura el calendario con la fecha de mañana por defecto y deshabilita días pasados
function establecerFechaEntregaDefecto() {
    let hoy = new Date();
    let manana = new Date();
    manana.setDate(hoy.getDate() + 1);
    
    // Formato YYYY-MM-DD necesario para el input date
    let yHoy = hoy.getFullYear();
    let mHoy = String(hoy.getMonth() + 1).padStart(2, '0');
    let dHoy = String(hoy.getDate()).padStart(2, '0');
    
    let yMan = manana.getFullYear();
    let mMan = String(manana.getMonth() + 1).padStart(2, '0');
    let dMan = String(manana.getDate()).padStart(2, '0');

    let inputFecha = document.getElementById('fechaEntrega');
    
    // Bloquear días anteriores en el calendario
    inputFecha.min = `${yHoy}-${mHoy}-${dHoy}`;
    
    // Marcar mañana por defecto
    inputFecha.value = `${yMan}-${mMan}-${dMan}`;
    ticketActual.fechaEntrega = `${dMan}-${mMan}-${yMan}`;
}

// Carga las ocupaciones previas desde localStorage
function cargarRegistroOcupacion() {
    let data = localStorage.getItem('lavanderia_ocupacion');
    if (data) {
        registroOcupacion = JSON.parse(data);
    }
}

// Carga el número correlativo de ticket
function cargarNumeroTicket() {
    let ultimoNum = localStorage.getItem('lavanderia_ultimo_ticket');
    ticketActual.numero = ultimoNum ? parseInt(ultimoNum) + 1 : 1;
    document.getElementById('badgeNumTicket').textContent = `Ticket #${ticketActual.numero}`;
    document.getElementById('resNum').textContent = `#${ticketActual.numero}`;
}

// Establece la fecha de mañana por defecto
function establecerFechaEntregaDefecto() {
    let manana = new Date();
    manana.setDate(manana.getDate() + 1);
    
    let d = String(manana.getDate()).padStart(2, '0');
    let m = String(manana.getMonth() + 1).padStart(2, '0');
    let y = manana.getFullYear();

    let inputFecha = document.getElementById('fechaEntrega');
    inputFecha.value = `${y}-${m}-${d}`;
    ticketActual.fechaEntrega = `${d}-${m}-${y}`;
}

function alCambiarFecha() {
    let fechaInput = document.getElementById('fechaEntrega').value;
    if (fechaInput) {
        ticketActual.fechaEntrega = formatearFechaDMY(fechaInput);
        ticketActual.horaEntrega = ''; // Reiniciar hora al cambiar día
        document.getElementById('horaManual').value = '';
        actualizarParrillaHoras();
    }
}

// ==========================================
// CONTROL Y GENERACIÓN DE PARRILLA DE HORAS
// ==========================================
function actualizarParrillaHoras() {
    const contenedor = document.getElementById('parrillaHoras');
    contenedor.innerHTML = '';

    let fechaKey = ticketActual.fechaEntrega;
    let ocupacionDia = registroOcupacion[fechaKey] || {};

    FRANJAS_HORARIAS.forEach(hora => {
        let lavadosUsados = ocupacionDia[hora] || 0;
        let esLlena = lavadosUsados >= MAX_LAVADORAS;

        let btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-hora';
        
        // Texto con el indicador (ej: "10:00 (3/5)")
        btn.innerHTML = `${hora}<br><small style="font-size: 0.8em; font-weight: normal;">(${lavadosUsados}/${MAX_LAVADORAS})</small>`;

        if (esLlena) {
            btn.classList.add('ocupado');
            btn.disabled = true;
        } else {
            if (ticketActual.horaEntrega === hora) {
                btn.classList.add('seleccionado');
            }
            btn.onclick = () => seleccionarHora(hora);
        }

        contenedor.appendChild(btn);
    });
}

// ==========================================
// NAVEGACIÓN ENTRE PASOS
// ==========================================
function siguientePaso(paso) {
    document.querySelectorAll('.paso-pantalla').forEach(el => el.classList.remove('activo'));
    document.getElementById(`paso${paso}`).classList.add('activo');

    if (paso === 2) {
        actualizarParrillaHoras();
    } else if (paso === 5) {
        actualizarResumen();
    }
}

// ==========================================
// CAPTURA DE DATOS
// ==========================================
function formatearFechaDMY(fechaString) {
    if (!fechaString) return '';
    let [y, m, d] = fechaString.split('-');
    return `${d}-${m}-${y}`;
}

function seleccionarHora(hora) {
    ticketActual.horaEntrega = hora;
    document.getElementById('horaManual').value = '';
    actualizarParrillaHoras();
}

function seleccionarHoraManual() {
    let hora = document.getElementById('horaManual').value;
    if (hora) {
        ticketActual.horaEntrega = hora;
        actualizarParrillaHoras();
    }
}

function seleccionarTemperatura(temp, elementoBtn) {
    ticketActual.temperatura = temp;
    document.querySelectorAll('#paso3 .btn-opcion').forEach(btn => btn.classList.remove('seleccionado'));
    elementoBtn.classList.add('seleccionado');
}

function seleccionarTipoRopa(tipo) {
    ticketActual.tipoRopa = tipo;
    document.getElementById('btnColor').classList.toggle('seleccionado', tipo === 'Color');
    document.getElementById('btnBlanca').classList.toggle('seleccionado', tipo === 'Blanca');
}

function seleccionarSecado(opcion) {
    ticketActual.secado = opcion;
    document.getElementById('btnSecadoNo').classList.toggle('seleccionado', opcion === 'NO');
    document.getElementById('btnSecadoSi').classList.toggle('seleccionado', opcion === 'SÍ');
}

// ==========================================
// ACTUALIZACIÓN DE RESUMEN Y TICKETS
// ==========================================
function actualizarResumen() {
    let rec = ticketActual.fechaRecepcion;
    let recFormatted = `${String(rec.getDate()).padStart(2,'0')}-${String(rec.getMonth()+1).padStart(2,'0')}-${rec.getFullYear()} ${String(rec.getHours()).padStart(2,'0')}:${String(rec.getMinutes()).padStart(2,'0')}`;

    // Pantalla Resumen
    document.getElementById('resFechaRec').textContent = recFormatted;
    document.getElementById('resFechaEntrega').textContent = ticketActual.fechaEntrega || 'No indicada';
    document.getElementById('resHoraEntrega').textContent = ticketActual.horaEntrega || 'No indicada';
    document.getElementById('resRopa').textContent = ticketActual.tipoRopa;
    document.getElementById('resTemp').textContent = ticketActual.temperatura;
    document.getElementById('resSecado').textContent = ticketActual.secado;

    // Tickets Imprimibles
    document.querySelectorAll('.lblNum').forEach(el => el.textContent = `#${ticketActual.numero}`);
    document.querySelectorAll('.lblRec').forEach(el => el.textContent = recFormatted);
    document.querySelectorAll('.lblFEntrega').forEach(el => el.textContent = ticketActual.fechaEntrega);
    document.querySelectorAll('.lblHEntrega').forEach(el => el.textContent = ticketActual.horaEntrega);
    document.querySelectorAll('.lblRopa').forEach(el => el.textContent = ticketActual.tipoRopa);
    document.querySelectorAll('.lblTemp').forEach(el => el.textContent = ticketActual.temperatura);
    document.querySelectorAll('.lblSecado').forEach(el => el.textContent = ticketActual.secado);
}

// ==========================================
// IMPRESIÓN Y CONTADOR
// ==========================================
function imprimirTickets() {
    actualizarResumen();

    // 1. Registrar un lavado más en la fecha y hora seleccionadas
    if (ticketActual.fechaEntrega && ticketActual.horaEntrega) {
        let fechaKey = ticketActual.fechaEntrega;
        let horaKey = ticketActual.horaEntrega;

        if (!registroOcupacion[fechaKey]) {
            registroOcupacion[fechaKey] = {};
        }

        let lavadosUsados = registroOcupacion[fechaKey][horaKey] || 0;
        registroOcupacion[fechaKey][horaKey] = lavadosUsados + 1;

        // Guardar ocupación en memoria local
        localStorage.setItem('lavanderia_ocupacion', JSON.stringify(registroOcupacion));
    }

    // 2. Disparar impresión
    window.print();

    // 3. Incrementar ticket
    localStorage.setItem('lavanderia_ultimo_ticket', ticketActual.numero);

    // 4. Reiniciar al paso 1 para la siguiente recepción
    setTimeout(() => {
        cargarNumeroTicket();
        ticketActual.horaEntrega = '';
        document.getElementById('horaManual').value = '';
        actualizarParrillaHoras();
        siguientePaso(1);
    }, 1000);
}