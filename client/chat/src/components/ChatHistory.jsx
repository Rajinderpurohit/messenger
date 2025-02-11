export default (loading, messages) => {
    return messages.map((msg, index) => (
                    <div key={index} className={`d-flex mb-2 ${msg.user_id === username ? 'justify-content-end' : ''}`}>
                        {msg.user_id !== username && (
                            <img className="rounded-circle dpic-40" src="profile_pic_thumb.png" alt="User Avatar" />
                        )}
                        <div
                            className={`bg-${msg.user_id === username ? 'primary' : 'light'} text-${msg.user_id === username ? 'white' : 'dark'} p-2 rounded-3 ${msg.sender === username ? 'text-end' : 'ms-3'}`}
                            style={{ maxWidth: '250px' }}
                        >
                            {msg.user_id === username ? msg.message_text : (
                                <div>
                                    <p className="mb-1">{msg.message_text}</p>
                                    <p className="text-muted small mb-0">{msg.user_id === username ? 'Me' : msg.user_id}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ));
};