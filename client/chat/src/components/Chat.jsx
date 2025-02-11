import { useState, useRef, useEffect } from 'react';
import { SERVER_URL, API_URL } from '../constants';
import sendRequest from '../ApiService';
import io from 'socket.io-client';
import '../App.css';
import FormatTime from './FormatTime';
import NotificationSound from './Notification'
import Modal from './Modal';
import LetterToImage from './LetterToImage';
import { getTime, createHyperLinks, getMetaData } from './functions';
import DocUploader from './DocUploader';
import Alert from './Alert';

function Chat({ username, token }) {
  const [isOpen, setOpen] = useState(false);
  const openAlert = () => { setOpen(true); };
  const closeAlertBox = () => { setOpen(false); };
  const scrollPositionRef = useRef(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = () => { setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); };
  const [message, setMessage] = useState('');
  const [chat_id, setChatId] = useState('');
  const [active_chat, setActiveChat] = useState('');
  const [messages, setMessages] = useState([]);
  const [triggerEvent, setTriggerEvent] = useState(false);
  // const updateContacts= ()=> { setTriggerEvent(true); setTimeout(() => setTriggerEvent(false), 1000); }
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [contacts, setContacts] = useState([]);
  const [usersearch, setUserSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userid = localStorage.getItem("user_id");
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const socket = useRef(null);
  const chatContainerRef = useRef(null);

  const fetchMessages = async (chat_id, pageNumber = 1) => {
    if (!chat_id) {
      setMessages([]);
      return false;
    }
    if (pageNumber == 1) setMessages([]);
    setLoading(true);
    try {
      const res = await sendRequest({
        url: `${API_URL}/messages?page=${pageNumber}`, // Change to your API endpoint
        method: 'POST',
        headers: { Authorization: token },
        body: { chat_id: chat_id }
      });
      setMessages((prevMessages) => [...res, ...prevMessages]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMessages(chat_id, page); }, [chat_id, page]);

  useEffect(() => {
    socket.current = io(SERVER_URL);
    socket.current.on('connect', () => {
      socket.current.emit('authenticate', { userId: token });
    });
    socket.current.on('receiveMessage', (message) => {
      setTriggerEvent(true);
      console.log(chat_id)
      console.log(message.chat_id)
      if (parseInt(message.chat_id) === parseInt(chat_id)) {
        console.log(chat_id)
        console.log(message.chat_id)
        setMessages((prevMessages) => [...prevMessages, message]);

      }
      // document.getElementById("cnt-last-msg-"+message.chat_id).textContent=message.message_text;

      setTimeout(() => setTriggerEvent(false), 1000);
    });
    return () => {
      socket.current.disconnect();
    };
  }, [chat_id]); // Only run once when the component mounts

  useEffect(() => {
    if (chatContainerRef.current) {
      // chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - scrollPositionRef.current
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message || message.trim() == '') {
      return false;
    }
    const newMessage = { sender: username, content: message, chat_id: chat_id };
    socket.current.emit('sendMessage', newMessage);
    setMessage('');  // Clear the input field after sending
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const GlobalKeyPress = (event) => {
    if (event.key === 'Esc' || event.key === 'Escape') {
      setChatId('');
      setActiveChat('')
      setPage(1)
      setSidebarOpen(false)
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current.scrollTop === 0 && !loading) {
      scrollPositionRef.current = chatContainerRef.current.scrollHeight;
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await sendRequest({
          url: `${API_URL}/contacts`,
          method: 'GET',
          headers: { Authorization: token },
        });
        setContacts(res); // Assuming `res` is an array of contacts
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
  }, [usersearch, triggerEvent]);

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="container-fluid" onKeyDown={GlobalKeyPress}>
      <div className="row vh-100">
        {/* Sidebar */}
        <div
          className={`pad-0 col-12 col-lg-3 bg-white border-end border-300 overflow-auto sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
          id="sidebar"
        >
          <div className="d-flex align-items-center p-2 border-bottom border-300 w-100">
            <div className='d-flex w-100'>
              <div className="flex-shrink-0 me-3">
                <img className="rounded-circle profile_pic" src="vite.svg" alt="User Avatar" />
              </div>
              <div>
                <h2 className="h5 mb-0">{username}</h2>
                <div className='d-flex align-items-center'>
                  <div style={{ height: '5px', width: '5px', border: '5px solid green', borderRadius: '10px' }} ></div><div className='ms-2'>Online</div>
                </div>
                {/* <p className="text-muted small">Online</p> */}
              </div>
            </div>
            <div>
              <button
                className="navbar-toggler d-lg-none navbar-close"
                type="button"
                onClick={toggleSidebar}
                aria-controls="sidebar"
                aria-expanded={sidebarOpen ? 'true' : 'false'}
                aria-label="Toggle navigation"
              >
                <span aria-hidden="true">&times;</span>
              </button>

            </div>
          </div>
          <div className=''>
            <div className="p-2 mb-1">
              <input type="text" className="form-control" placeholder="Search" id='chat-search' value={usersearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div onClick={() => { setSidebarOpen(false); }}>
              <ul className="list-group list-group-flush cs-ul">
                {
                  contacts.map((chat, index) => {
                    return (
                      <li key={index} onClick={() => { setChatId(chat.chat_id); setActiveChat(chat.chat_name); setPage(1);scrollPositionRef.current=0; if (sidebarOpen) { setSidebarOpen(false); } }} chat-id={chat.chat_id} className="list-group-item d-flex align-items-center p-2 hover-bg-light cursor-pointer">
                        {/* <img className="rounded-circle dpic-40" src="profile_pic_thumb.png" alt="User Avatar" /> */}
                        <LetterToImage letter={chat.chat_name[0]} />
                        <div className="ms-3 d-flex flex-column last-msg w-100">
                          <div className='d-flex w-100 justify-content-between'><h3 className="h6 mb-1">{chat.chat_name}</h3><span className='small mb-1'>{FormatTime(chat.message_time)}</span></div>
                          <div className="text-muted small mb-0 last-msg" id={"cnt-last-msg-" + chat.chat_id}>{chat.last_message}</div>
                        </div>
                      </li>
                    )
                  })
                }
              </ul>
              <div className='add-chat ms-2' onClick={() => { openModal() }}>+</div>
            </div>
          </div>
        </div>

        {active_chat ? <>
          {/* Chat Area */}
          <div className="pad-0 col-12 col-lg-9 flex-fill bg-white border-300 overflow-auto">
            <div className='d-flex border-bottom border-300 ps-3 align-items-center'>
              {/* Navbar - Hamburger Menu Icon */}
              <nav className="navbar navbar-expand-lg navbar-light">
                <button className="navbar-toggler d-lg-none" type="button" onClick={toggleSidebar} aria-controls="sidebar" aria-expanded={sidebarOpen ? 'true' : 'false'}
                  aria-label="Toggle navigation">
                  <span className="navbar-toggler-icon"></span>
                </button>
              </nav>
              <div className="d-flex align-items-center p-2 gap-1 pl-4 ms-2">
                <img src='http://localhost:5173/profile_pic_thumb.png' className='dpic-40' />
                <span className="h6 mb-0">{active_chat}</span>
                <a href="#" onClick={ openAlert }>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                  </svg>
                </a>
                {/* <span className="d-flex text-muted small align-items-center"><div style={{ height: '5px', width: '5px', border: '5px solid green', borderRadius: '10px' }} ></div><div className='ms-2'>Online</div></span> */}
              </div>
            </div>
            <div className="p-2" style={{ overflowY: 'scroll', height: 'calc(100vh - 110px)' }} ref={chatContainerRef} onScroll={handleScroll}>
              {/* {loading ? <div>Loading...</div> : <ChatHistory loading={ loading } messages={ messages } />} */}
              {loading && <div className="">Loading...</div>}
              {/* {
                messages.map((msg, index) => (

                  <div key={index} className={`d-flex mb-2 ${msg.user_id === parseInt(userid) ? 'justify-content-end' : ''}`}>
                    {msg.user_id !== parseInt(userid) && (
                      <img className="rounded-circle dpic-40" src="profile_pic_thumb.png" alt="User Avatar" />
                    )}
                    <div
                      className={`bg-${msg.user_id === parseInt(userid) ? 'theme' : 'light'} text-${msg.user_id === parseInt(userid) ? 'white' : 'dark'} p-2 rounded-3 ${msg.sender === username ? 'text-end' : 'ms-3'} msg-chip `}
                    >
                      {msg.user_id === parseInt(userid) ? msg.message_text : (
                        <div>
                          <div className="d-flex w-100 justify-content-between"><span className="text-muted small mb-0 ">{msg.user_id === parseInt(userid) ? 'Me' : msg.sender_name}</span><pre> </pre><span className="text-muted small mb-0">{FormatTime(msg.created_at)}</span></div>
                          <p className="mb-1">{msg.message_text}</p>

                        </div>
                      )}
                    </div>
                  </div>
                ))
              } */}
              {
                
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date} className="mb-4">
                    <div className="text-center text-muted mb-2 d-flex justify-content-center"><div className='date-chip'>{FormatTime(date)}</div></div>
                    {msgs.map((msg, index) => (
                      <div
                        key={index}
                        className={`d-flex mb-2 ${msg.user_id === parseInt(userid) ? 'justify-content-end' : ''}`}
                      >
                        {msg.user_id !== parseInt(userid) && (
                          <img
                            className="rounded-circle dpic-40"
                            src="profile_pic_thumb.png"
                            alt="User Avatar"
                          />
                        )}
                        <div
                          className={`bg-${msg.user_id === parseInt(userid) ? 'theme' : 'light'} text-${msg.user_id === parseInt(userid) ? 'white' : 'dark'} p-1 rounded-3 ${msg.sender === username ? 'text-end' : 'ms-3'} msg-chip`}
                        >
                          {msg.user_id === parseInt(userid) ? (
                            <div className='d-flex'>
                              <div className='mb-3'><div className='b-word'>{ msg.message_text }</div></div>
                              {/* <div className='mb-3'><div className='b-word' dangerouslySetInnerHTML={{ __html: createHyperLinks(msg.message_text) }} /></div> */}
                              <div className="tiny-font mb-0 d-flex justify-content-end align-items-end">{getTime(msg.created_at)}</div>
                              </div>
                          ) : (
                            <div className='d-flex'>
                              <div className="d-flex flex-column mb-3">
                                <span className="text-muted tiny-font mb-0">
                                  {msg.user_id === parseInt(userid) ? 'Me' : msg.sender_name}
                                </span>
                                <div className="mb-0">
                                  {/* {createHyperLinks(msg.message_text)} */}
                                  <div dangerouslySetInnerHTML={{ __html: createHyperLinks(msg.message_text) }} />
                                  </div>
                              </div>
                              <div className="text-muted tiny-font mb-0 d-flex align-items-end justify-content-end">{getTime(msg.created_at)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
                
              }
            </div>
            {/* Message Input */}
            <div className="p-2 border-top border-300 msg-input bg-white">
              {/* <div className="d-flex attachment-container"></div> */}
              {/* <DocUploader message={ message } setMessage={ setMessage } sendMessage={ sendMessage }/> */}
              <div className="d-flex">
                <div className="upload">
                  <label className="upload-area">
                    <input type="file"  className='input-file' onChange={ (e)=>{ console.log(getFileSize(e.target.files[0])) }} />
                      <span className="upload-button">
                        <svg fill="#888" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
                          width="18px" height="18px" viewBox="0 0 45.402 45.402"
                          xmlSpace="preserve">
                          <g>
                            <path d="M41.267,18.557H26.832V4.134C26.832,1.851,24.99,0,22.707,0c-2.283,0-4.124,1.851-4.124,4.135v14.432H4.141
		c-2.283,0-4.139,1.851-4.138,4.135c-0.001,1.141,0.46,2.187,1.207,2.934c0.748,0.749,1.78,1.222,2.92,1.222h14.453V41.27
		c0,1.142,0.453,2.176,1.201,2.922c0.748,0.748,1.777,1.211,2.919,1.211c2.282,0,4.129-1.851,4.129-4.133V26.857h14.435
		c2.283,0,4.134-1.867,4.133-4.15C45.399,20.425,43.548,18.557,41.267,18.557z"/>
                          </g>
                        </svg>
                      </span>
                  </label>
                </div>



                <input type="text" className="form-control msg-input-box" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Type a message..." />
                <button className="send-button" onClick={sendMessage}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </> : <><div className="pad-0 col-12 col-lg-9 flex-fill bg-white border-300 overflow-auto">
          <div className='d-flex border-bottom border-300 ps-3 align-items-center'>
            {/* Navbar - Hamburger Menu Icon */}
            <nav className="navbar navbar-expand-lg navbar-light">
              <button className="navbar-toggler d-lg-none" type="button" onClick={toggleSidebar} aria-controls="sidebar" aria-expanded={sidebarOpen ? 'true' : 'false'}
                aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
            </nav>
          </div>
          <div className="welcome_banner d-flex align-items-center ">
            <p className='mx-auto text-white font-weight-bold iconic-text'>
              Welcome !!!!
            </p>
          </div>
        </div>
        </>}
      </div>
      <NotificationSound triggerEvent={triggerEvent} />
      <Alert isOpen={ isOpen } onClose={ closeAlertBox } title={"Title of the box"}>
        <p>I am a box hehe...</p>
      </Alert>
      {/* Modal Component */}
      <Modal isOpen={isModalOpen} onClose={closeModal} triggerEvent={setTriggerEvent} chatId={setChatId} />
    </div>
  );
}

export default Chat;
