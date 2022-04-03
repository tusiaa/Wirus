import mqtt from "mqtt";

var properties = {
    usersReload: false,
    gamesReload: false,
    mainChatReload: false,
    mainChat: [],
    gameReload: false,
    gamePlayersReload: false,
    gameChatReload: false,
    gameChat: [],
    messagesReload: false,
    messages: [],
    invitesReload: false,
    invites: [],
    client: mqtt.connect('ws://127.0.0.1:8082/mqtt'),
}

properties.client.on('message', (topic, message) => {
    if(topic === '/login' || topic === '/logout' || topic === '/guest'){
        console.log(message.toString())
        properties.usersReload = true;
    }
    if(topic === '/login' && !message.toString().startsWith('guest') && message.toString() !== 'edit'){
        properties.mainChat.push(message.toString() + ' has joined the chat')
        properties.mainChatReload = true;
    }
    if(topic === '/logout' && !message.toString().startsWith('guest')){
        properties.mainChat.push(message.toString() + ' has left the chat')
        properties.mainChatReload = true;
    }
    if(topic === '/games'){
        console.log(message.toString())
        properties.gamesReload = true;
    }  
    if(topic === '/main-chat'){ 
        console.log(message.toString())
        properties.mainChat.push(message.toString())
        properties.mainChatReload = true;
    }
    if(topic.startsWith('/game/')){
        console.log(message.toString())
        properties.gameReload = true;
    }
    if(topic.startsWith('/players/')){
        console.log(message.toString())
        properties.gamePlayersReload = true;
    }
    if(topic.startsWith('/chat/')){
        console.log(message.toString())
        properties.gameChat.push(message.toString())
        properties.gameChatReload = true;
    }
    if(topic.startsWith('/messages/')){
        console.log(JSON.parse(message.toString()))
        properties.messages.push(JSON.parse(message.toString()))
        properties.messagesReload = true;
    }
    if(topic.startsWith('/invites/')){
        console.log(JSON.parse(message.toString()))
        if(!properties.invites.find(invite => invite.id === JSON.parse(message.toString()).id)){
            properties.invites.push(JSON.parse(message.toString()))
            properties.invitesReload = true;
        }
    }
})


export default properties;