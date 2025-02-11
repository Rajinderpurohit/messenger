import React, { useState } from "react";
import { API_URL } from '../constants';
import { getFileSize } from './functions';
import '../App.css';

function DocUploader(message,setMessage,sendMessage) {
    const [imagePreview, setImagePreview] = useState(null);
    const [file, setFile] = useState(null);
    // const [message, setMessage] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
          sendMessage();
        }
      };
    //   const sendMessage = () => {
    //     if (!message || message.trim() == '') {
    //       return false;
    //     }
    //     const newMessage = { sender: username, content: message, chat_id: chat_id };
    //     socket.current.emit('sendMessage', newMessage);
    //     setMessage('');  // Clear the input field after sending
    //   };
    // Handle File Selection
    const handleFileSelect = (selectedFile) => {
        if (!selectedFile || !selectedFile.type.startsWith("image/")) {
            alert("Please upload a valid image file.");
            setImagePreview(null);
            setFile(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(selectedFile);
        setFile(selectedFile); // Store file for upload
    };

    // Handle File Change from Input
    const handleImageChange = (event) => {
        const selectedFile = event.target.files[0];
        handleFileSelect(selectedFile);
    };

    // Handle Drag and Drop
    const handleDrop = (event) => {
        event.preventDefault();
        const selectedFile = event.dataTransfer.files[0];
        handleFileSelect(selectedFile);
    };

    // Handle Upload
    const handleImageUpload = () => {
        if (!file) {
            alert("No file selected.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        const xhr = new XMLHttpRequest();

        // Track Upload Progress
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                setUploadProgress(progress); // Update progress
            }
        };

        // Handle Upload Completion
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    setUploadedFileName(data.file);
                    alert("Image uploaded successfully!");
                } else {
                    alert("Error uploading image.");
                }
                setUploadProgress(0); // Reset progress
            }
        };

        xhr.open("POST", `${API_URL}/upload`, true);
        xhr.send(formData); // Send file
    };

    const handleDragOver = (event) => event.preventDefault();

    return (
        <>
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
        </>
    );
}

export default DocUploader;