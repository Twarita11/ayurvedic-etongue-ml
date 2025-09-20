import React, { useState, useEffect } from 'react';

// Basic styles for the component. You can move this to a separate CSS file.
const styles = {
  container: {
    fontFamily: 'sans-serif',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    maxWidth: '400px',
    textAlign: 'center',
    margin: '20px auto',
  },
  button: {
    backgroundColor: '#0088cc',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  infoText: {
    marginBottom: '10px',
    color: '#333',
  },
  botLink: {
    color: '#0088cc',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  codeBlockContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: '8px 12px',
    borderRadius: '5px',
    border: '1px solid #eee',
    marginBottom: '12px',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#e83e8c', // A distinct color for the code
  },
  copyButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  timerText: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#777',
    fontWeight: 'bold',
  },
};

const TelegramSubscribe = () => {
  const [factoryName, setFactoryName] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [factoryMedicineId, setFactoryMedicineId] = useState('');

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  // On component mount, get data from localStorage
  useEffect(() => {
    const f = localStorage.getItem('factoryName') || '';
    const m = localStorage.getItem('medicineName') || '';
    setFactoryName(f);
    setMedicineName(m);
    if (f && m) {
      setFactoryMedicineId(`${f}_${m}`);
    }
  }, []);

  // Handles the countdown timer
  useEffect(() => {
    if (!isTimerActive) return;

    // When countdown reaches 0, reset the component state
    if (countdown === 0) {
      setIsTimerActive(false);
      return;
    }

    // Decrease the countdown every second
    const intervalId = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Cleanup interval on component unmount or when timer stops
    return () => clearInterval(intervalId);
  }, [isTimerActive, countdown]);


  const handleSubscribeClick = () => {
    setCountdown(30); // Reset timer to 30 seconds
    setIsTimerActive(true); // Show the code block and timer
    setCopyButtonText('Copy'); // Reset copy button text
  };

  const handleCopyClick = () => {
    const command = `${factoryMedicineId}`;
    navigator.clipboard.writeText(command).then(() => {
      setCopyButtonText('Copied! ✅');
      setTimeout(() => setCopyButtonText('Copy'), 2000); // Revert after 2s
    });
  };
  
  // Replace 'YOUR_BOT_USERNAME' with your actual Telegram bot's username
  const botLink = "https://t.me/Ayurvedic_Quality_bot";

  return (
    <div style={styles.container}>
      {!isTimerActive ? (
        // ## The Button View
        <button
          onClick={handleSubscribeClick}
          disabled={!factoryMedicineId}
          style={{
            ...styles.button,
            ...( !factoryMedicineId ? styles.buttonDisabled : {}),
          }}
        >
          Subscribe in Telegram
        </button>
      ) : (
        // ## The Timer & Code Block View
        <div>
          <p style={styles.infoText}>
            Copy this message to the{' '}
            <a href={botLink} target="_blank" rel="noopener noreferrer" style={styles.botLink}>
              bot
            </a>
          </p>

          <div style={styles.codeBlockContainer}>
            <code style={styles.codeText}>{factoryMedicineId}</code>
            <button onClick={handleCopyClick} style={styles.copyButton}>
              {copyButtonText}
            </button>
          </div>
          
          <p style={styles.timerText}>
            This message will disappear in {countdown} seconds.
          </p>
        </div>
      )}
    </div>
  );
};

export default TelegramSubscribe;