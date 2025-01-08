const listContacts = document.querySelector('.list-contact');
const contentChat = document.querySelector('.content-chat-history');

const formMessage = document.querySelector('.frm-message');

const chatHtml = document.getElementById('chat');

const backUrl = ENVS.BACK_URL;
const socketUrl = ENVS.SOCKET_URL;

let contactFocus = null;


async function traerChat(phoneNumber){
  const chat = await fetch(`${backUrl}/api/whatsapp/chats/${phoneNumber}`).then( response => response.json() );
  showChat( chat.messages );
}

async function traerListContact(){
  const contacts = await fetch(`${backUrl}/api/whatsapp/contacts`).then( response => response.json() );
  showListContacts( contacts );
}

function showListContacts(contacts){
  listContacts.innerHTML = '';
  contacts.forEach(contact => {
    const lastMessage = contact.lastMessage;

    const message = (lastMessage.of === 'me')
      ? lastMessage.text
      : `${contact.nameContact}: ${lastMessage.text}`;

    const li = document.createElement('li');
    li.classList.add('contact');
    li.classList.remove('chat-selected');
    li.innerHTML = `
      <div class="icon-contact"> M </div>
      <div class="name-contact">
          <h2>${contact.nameContact}</h2>
          <div>${message}</div>
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

function showChat( messages ){
  chatHtml.innerHTML = '';
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
    if(type === 'on-contact-new'){
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
    console.log( 'Connected' );
  };
}

formMessage.addEventListener('submit', async(e)=>{
  e.preventDefault();
  const inputMessage = e.target[1];

  await sendMessage(contactFocus.phoneNumber, inputMessage.value);

  inputMessage.value = '';
})

connectToWebSockets();