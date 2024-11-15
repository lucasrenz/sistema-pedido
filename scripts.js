import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ldclxmhtxixlhcjzkqci.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkY2x4bWh0eGl4bGhjanprcWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0OTEwMDQsImV4cCI6MjAzNzA2NzAwNH0.mBH6Ydp01VZf7ZodV4CgfI0eUNETn4upHqqiXKxL5Fo';
const supabase = createClient(supabaseUrl, supabaseKey);
let selectedOrderNumber = null;
let lastOrderCount = 0;  // Variável para armazenar o número de pedidos na última atualização
let audioInitialized = false; // Flag para verificar se o áudio foi ativado pelo usuário

// Função para carregar os pedidos
async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, customer_name, customer_cpf, total_value, order_time, payment_status, returner')
    .is('returner', null); // Para carregar apenas os pedidos não devolvidos

  if (error) {
    console.error('Erro ao carregar pedidos:', error);
    return;
  }

  const tbody = document.querySelector('#orderTable tbody');
  tbody.innerHTML = ''; // Limpar a tabela antes de preencher

  data.forEach(order => {
    const row = document.createElement('tr');
    
    // Extrair apenas HH:MM da hora
    const orderTime = order.order_time ? order.order_time.slice(0, 5) : 'N/A';

    // Adicionar a classe "pago-online" se o status for "Pago Online"
    const paymentStatusClass = order.payment_status === 'Pago Online' ? 'pago-online' : '';

    row.innerHTML = `
      <td>${order.order_number}</td>
      <td>${order.customer_name}</td>
      <td>${order.customer_cpf}</td>
      <td>${order.total_value}</td>
      <td>${orderTime}</td>
      <td class="${paymentStatusClass}">${order.payment_status}</td>
      <td><button class="btn" data-order-number="${order.order_number}">Devolver</button></td>
    `;

    tbody.appendChild(row);
  });

  // Verificar se houve novos pedidos
  if (data.length > lastOrderCount) {
    // Se o número de pedidos aumentou, isso significa que novos pedidos foram inseridos
    if (audioInitialized) {
      playAlertSound();  // Tocar o som de alerta apenas se o áudio foi ativado
    }
  }

  // Atualizar o contador de pedidos para a próxima comparação
  lastOrderCount = data.length;

  // Adiciona o evento de clique aos botões "Devolver"
  const buttons = document.querySelectorAll('button.btn');
  buttons.forEach(button => {
    button.addEventListener('click', (event) => {
      const orderNumber = event.target.getAttribute('data-order-number');
      devolverPedido(orderNumber);
    });
  });
}

// Função para tocar o som de alerta
function playAlertSound() {
  const audio = document.getElementById('alertSound');
  audio.play();  // Tocar o som
}

// Função chamada ao clicar no botão "Devolver"
window.devolverPedido = async function(orderNumber) {
  selectedOrderNumber = orderNumber;  // Atribui o número do pedido
  const confirmation = window.confirm("Tem certeza de que deseja marcar este pedido como devolvido?");
  
  if (confirmation) {
    const { data, error } = await supabase
      .from('orders')
      .update({ returner: 'Devolvido' })
      .eq('order_number', selectedOrderNumber);

    if (error) {
      console.error('Erro ao devolver o pedido:', error);
      return;
    }

    // Recarregar os pedidos para refletir a mudança
    loadOrders();
  }
}

// Configurar o botão para ativar o som
document.getElementById('initSound').addEventListener('click', () => {
  audioInitialized = true;  // A flag é ativada, permitindo o som ser tocado
  alert('Alerta sonoro ativado!');  // Mensagem ao usuário para confirmar a ativação
});

// Carregar os pedidos ao iniciar
window.onload = function() {
  loadOrders(); // Carregar inicialmente
  setInterval(loadOrders, 200); // Atualizar a lista de pedidos a cada 20 segundos (20.000 ms)
};
