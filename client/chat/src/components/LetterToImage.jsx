import React, { useRef, useEffect, useState } from 'react';

const LetterToImage = ({ letter }) => {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size (you can adjust the size as needed)
    const canvasSize = 200;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear the canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#999'; // Change this to any color you prefer
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set the font and style
    ctx.font = '100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the letter on the canvas
    ctx.fillStyle = '#000';  // Black color for the letter
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2);

    // Convert canvas content to image data URL
    setImageUrl(canvas.toDataURL());
  }, [letter]);

  return (
    <div>
      {/* Display the image created from the canvas */}
      {imageUrl && <img src={imageUrl} className="rounded-circle dpic-40" alt="Letter" />}
      {/* Render the canvas for debugging purposes */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default LetterToImage;
