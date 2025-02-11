import React, { useState } from 'react';
import { API_URL } from '../constants';
import sendRequest from '../ApiService';
import '../App.css';
var users = [];
(async ()=>{
  try {
    const res = await sendRequest({
      url: `${API_URL}/list?page=1`, // Change to your API endpoint
      method: 'GET',
      headers: { Authorization: localStorage.getItem("token") },
    });
    users = users.concat(res);
  } catch (err) {
    console.error(err);
  }
})();

// Modal Component
const Modal = ({ isOpen, onClose, triggerEvent, chatId}) => {
  const [chatType, setChatType] = useState('individual'); // 'individual' or 'group'
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const onCreateChat=async (chatType, users) => {
    try {
      const res = await sendRequest({
        url: `${API_URL}/createchat`, // Change to your API endpoint
        method: 'POST',
        headers: { Authorization: localStorage.getItem("token") },
        body: { chatType: chatType, users : users }
      });
      if(res.chatId){
        triggerEvent(true);
        setTimeout(() => triggerEvent(false), 1000);
        chatId(res.chatId);
        let startchat=res.chatId;
        document.querySelectorAll('[chat-id]').forEach((item)=>{ if(parseInt(item.getAttribute("chat-id"))==startchat){ item.click() } })
      }
      
      
    } catch (err) {
      console.error(err);
    }
    // if (chatType === 'individual') {
    //   console.log(`Created individual chat with: ${users[0].name}`);
    // } else {
    //   console.log(`Created group chat with: ${users.map((u) => u.name).join(', ')}`);
    // }
  }

  const handleUserSelect = (user) => {
    if (chatType === 'individual') {
      setSelectedUser(user);
    } else {
      
      if(selectedGroupUsers.includes(user)){
        handleUserDeselect(user.id);
      }else {
        setSelectedGroupUsers((prev) => [...prev, user]);
      }
      console.table(selectedGroupUsers);
    }
  };

  const handleUserDeselect = (userId) => {
    setSelectedGroupUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleCreateChat = () => {
    if (chatType === 'individual' && selectedUser) {
      onCreateChat('individual', [selectedUser]);
    } else if (chatType === 'group' && selectedGroupUsers.length > 0) {
      onCreateChat('group', selectedGroupUsers);
    }
    onClose();
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2>Create a New Chat</h2>

        <div className="chat-type-toggle">
          <button className={ chatType=='individual'?"tg-active":'' } onClick={() => setChatType('individual') }>Individual Chat</button>
          <button className={ chatType=='group'?"tg-active":'' } onClick={() => setChatType('group')}>Group Chat</button>
        </div>

        {chatType === 'individual' && (
          <div>
            <h6>Select a User</h6>
            <input
              type="text"
              placeholder="Search user..."
              className='form-control'
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <ul className="user-list">
              {filteredUsers.map((user) => (
                <li key={user.id} onClick={() => handleUserSelect(user)}>
                  {user.name} - { user.dept }
                </li>
              ))}
            </ul>
            {selectedUser && <div>Selected: {selectedUser.name}</div>}
          </div>
        )}

        {chatType === 'group' && (
          <div>
            <h6>Select Users for Group</h6>
            <input
              type="text"
              placeholder="Search users..."
              className='form-control'
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <ul className="user-list">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={
                    selectedGroupUsers.some((u) => u.id === user.id)
                      ? 'selected'
                      : ''
                  }
                >
                  {user.name} - { user.dept }
                </li>
              ))}
            </ul>
            <div className='group-users-list'>
              <strong>Selected Users:</strong>
              <ul>
                {selectedGroupUsers.map((user) => (
                  <li key={user.id}>
                    {user.name}{' '}
                    <button onClick={() => handleUserDeselect(user.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <button className="create-chat-btn" onClick={handleCreateChat}>
          Create Chat
        </button>
      </div>
    </div>
  );
};

export default Modal;