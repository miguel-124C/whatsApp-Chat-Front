const listContacts = document.querySelector('.list-contact');
const contentChat = document.querySelector('.content-chat-history');
const loader = document.querySelector('.loader');

const formMessage = document.querySelector('.frm-message');

const chatHtml = document.getElementById('chat');

const backUrl = ENVS.BACK_URL;
const socketUrl = ENVS.SOCKET_URL;

let contactFocus = null;

function mostrarLoader( mostrar ){
  const messagesLoader = [
    'Cargando, por favor espere',
    'Conectando...',
    'Esto puede tardar un poco',
    'Desventajas de tener el plan Free :('
  ];

  loader.style.display = (mostrar) ? 'flex' : 'none';

  let index = 0;
  loader.textContent =  messagesLoader[index];
  const messageInterval = setInterval(() => {
    if (!mostrar){
      clearInterval(messageInterval);
      return;
    }
    index++;
    if(index == messagesLoader.length ) index = 0;
    
    loader.textContent =  messagesLoader[index];
  }, 2000);
}

async function traerChat(phoneNumber){
  const chat = await fetch(`${backUrl}/api/whatsapp/chats/${phoneNumber}`)
    .then( response => response.json() );
  showChat( chat.messages );
}

async function traerListContact(){
  const contacts = await fetch(`${backUrl}/api/whatsapp/contacts`)
    .then( response => response.json() );
  showListContacts( contacts );
}

function showListContacts(contacts){
  listContacts.innerHTML = '';
  contacts.forEach(contact => {
    const lastMessage = contact.lastMessage;

    const message = (lastMessage.of === 'me')
      ? lastMessage.text
      : `${contact.nameContact}: ${lastMessage.text}`;
  
    const timeMessage = transformTimestampToString( lastMessage.timestamp )

    const li = document.createElement('li');
    li.classList.add('contact');
    li.classList.remove('chat-selected');
    li.innerHTML = `
      <div class="icon-contact">
        <i class="fa-solid fa-user fa-2xl"></i>
      </div>
      <div class="name-contact">
          <h2>${contact.nameContact}</h2>
          <div class="view-message-contact">
            <div class="msg-contact">${message}</div>
            <span>${timeMessage}</span>
          </div>
      </div>
    `;

    li.addEventListener('click', ()=>{
      li.classList.add('chat-selected');
      contentChat.style.display = 'grid';
      contactFocus = contact;
      traerChat(contact.phoneNumber)
    })
    listContacts.appendChild(li);
  });
}

function showInfoMessage( messageHtml, status, timestamp, meTo ){
  const timeMessage = transformTimestampToString( timestamp );
  const divInfo = document.createElement('div');
  divInfo.classList.add('content-info-message')
  const timeInfo = document.createElement('span');
  const statusInfo = document.createElement('span');

  timeInfo.textContent = timeMessage;
  divInfo.appendChild(timeInfo);

  if(meTo == 'me'){
    if(status == 'sent') statusInfo.innerHTML = `<i class="fa-solid fa-check"></i>`;
    if(status == 'delivered') statusInfo.innerHTML = `<i class="fa-solid fa-check-double"></i>`;
    if(status == 'read') statusInfo.innerHTML = `<i class="fa-solid fa-check-double" style="color: #74C0FC;"></i>`;

    divInfo.appendChild(statusInfo);
  }

  messageHtml.appendChild(divInfo);
}

function showChat( messages ){
  chatHtml.innerHTML = '';
  moveScrollToBottomm( chatHtml );
  messages.forEach((m)=>{
    const contentMessage = document.createElement('div');
    contentMessage.classList.add('content-message');

    const message = document.createElement('div');
    contentMessage.appendChild(message);
    message.classList.add('message');

    if(m.of === 'me'){
      contentMessage.style.justifyContent = 'flex-end'
      message.classList.add('message-me');
    }
    if(m.of === 'to') message.classList.add('message-contact');

    message.textContent = m.text;
    showInfoMessage(message, m.status, m.timestamp, m.of);
    chatHtml.appendChild(contentMessage);
  });
}

async function sendMessage( to, message ){
  await fetch(`${backUrl}/api/whatsapp/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Indica que el body está en formato JSON
    },
    body: JSON.stringify({ to, message }) 
  }).then( response => true );
}

function connectToWebSockets() {
  const socket = new WebSocket( socketUrl );

  traerListContact();
  socket.onmessage = ( event ) => {
    const { type, payload } = JSON.parse(event.data);
    if(type === 'on-contact-changed'){
      showListContacts( payload );
    }

    if(type === 'on-chat-changed'){
      if (payload.phoneNumber === contactFocus.phoneNumber) {
        showChat( payload.messages );
      }
    }
  };

  socket.onclose = ( event ) => {
    console.log( 'Connection closed' );
    setTimeout( () => {
      console.log( 'retrying to connect' );
      connectToWebSockets();
    }, 1500 );
  };

  socket.onopen = ( event ) => {
    mostrarLoader(false);
    console.log( 'Connected' );
  };
}

const transformTimestampToString = (timestamp, isHour12 = false) =>{
  return new Date(timestamp * 1000).toLocaleString(undefined,{
    hour12: isHour12,
    hour: "2-digit",
    minute: "2-digit",
  });
}

const moveScrollToBottomm = ( component ) =>{
  component.scrollTo({
    top: component.scrollHeight
  });
}



formMessage.addEventListener('submit', async(e)=>{
  e.preventDefault();
  const inputMessage = e.target[1];

  await sendMessage(contactFocus.phoneNumber, inputMessage.value);

  inputMessage.value = '';
})

connectToWebSockets();
mostrarLoader(true);