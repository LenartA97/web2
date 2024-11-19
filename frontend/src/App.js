import { useEffect, useState, useRef } from 'react'
import './App.css'
import io from 'socket.io-client'

const App = () => {
  const [init, setInit] = useState(false)
  const [text, setText] = useState('')
  const [user, setUser] = useState('')
  const [messages, setMessages] = useState([])
  const [saved, setSave] = useState(false)
  const socket = useRef()

  useEffect(() => {
    const connect = async () => {
      const s = io('http://localhost:8080')
      s.on('welcome', (messages) => setMessages(messages))
      s.on('change', (message) =>
        setMessages((oldMessages) => [...oldMessages, message])
      )
      socket.current = s

      setInit(true)
    }

    if (!init && !socket.current) {
      connect()
    }
  }, [init])

  const send = (e) => {
    e.preventDefault()
    const message = { value: text, user }
    socket.current.emit('text', message)
    setMessages([...messages, message])
    setText('')
  }

  if (!user || !saved) {
    return (
      <div>
        <input
          placeholder="username"
          onChange={(e) => setUser(e.target.value)}
          value={user}
          onKeyDown={(key) => {
            if (key.code === 'Enter') {
              setSave(true)
            }
          }}
        />
        <button onClick={() => setSave(true)}>ok</button>
      </div>
    )
  }

  return (
    <div className="App">
      <form onSubmit={send}>
        <input onChange={(e) => setText(e.target.value)} value={text} />
        <button type="submit">send</button>
      </form>
      <br />
      <table style={{ width: '100%' }}>
        <tbody>
          {messages.map(({ value, user: _user }) => (
            <tr key={Math.random()}>
              <td style={{ textAlign: _user === user ? 'right' : 'left' }}>
                <span
                  style={{ fontWeight: _user !== user ? 'bold' : 'inherit' }}
                >
                  {_user}:{value}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
