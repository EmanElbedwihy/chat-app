const socket = io()

const $form = document.querySelector('#message-form')
const $text = $form.querySelector('input')
const $btn = $form.querySelector('button')
const $locbtn = document.querySelector('#loc')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        location: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')


    })
    $messages.innerHTML = html
    autoscroll()
})
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users

    })
    $sidebar.innerHTML = html
})
$form.addEventListener('submit', (e) => {
    e.preventDefault()
    $btn.setAttribute('disabled', 'disabled')
    mes = e.target.elements.message.value
    socket.emit('sendMessage', mes, (e) => {

        $btn.removeAttribute('disabled')
        $text.value = ''
        $text.focus()
        if (e) {
            return console.log(e)
        }
        console.log('delivered')
    })
})
$locbtn.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Location is not supported by your browser')
    }
    $locbtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }
        socket.emit('sendLocation', pos, () => {
            $locbtn.removeAttribute('disabled')
            console.log('location shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
