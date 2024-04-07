import React, { useState, useRef } from 'react';
import { Typography, AppBar, Button, TextField, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RecordRTC from 'recordrtc'; // Import RecordRTC library

import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import Notifications from './components/Notifications';

const useStyles = makeStyles((theme) => ({
  appBar: {
    borderRadius: 15,
    margin: '30px 100px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '600px',
    border: '2px solid black',

    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
  image: {
    marginLeft: '15px',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  chatContainer: {
    width: '100%',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: '#f2f2f2',
    borderRadius: '5px',
  },
  chatInput: {
    marginTop: '10px',
  },
}));

const App = () => {
  const classes = useStyles();
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const options = {
        type: 'video',
        mimeType: 'video/webm',
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
        bitsPerSecond: 2628000,
      };

      const recorder = RecordRTC(stream, options);
      mediaRecorderRef.current = recorder;
      recorder.startRecording();
      setRecording(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      // Handle permission errors here (e.g., display an alert)
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stopRecording(() => {
      const blob = mediaRecorderRef.current.getBlob();
      setRecordedBlob(blob);
      setRecording(false);
      downloadRecording(blob);
    });
  };

  const downloadRecording = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'recorded-screen.webm';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendMessage = () => {
    if (messageInput.trim() !== '') {
      setChatMessages([...chatMessages, { sender: 'Me', message: messageInput }]);
      setMessageInput('');
    }
  };

  return (
    <div className={classes.wrapper}>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <Typography variant="h2" align="center">Screen Recorder</Typography>
      </AppBar>
      <VideoPlayer />
      <Sidebar>
        <Notifications />
        {recording ? (
          <Button variant="contained" color="secondary" onClick={stopRecording}>Stop Recording</Button>
        ) : (
          <Button variant="contained" color="primary" onClick={startRecording}>Start Recording</Button>
        )}
        {recordedBlob && (
          <Button variant="contained" color="primary" onClick={() => downloadRecording(recordedBlob)}>Download Recording</Button>
        )}
        <div className={classes.chatContainer}>
          {chatMessages.map((msg, index) => (
            <Typography key={index}><strong>{msg.sender}:</strong> {msg.message}</Typography>
          ))}
        </div>
        <Grid container spacing={2} alignItems="center" className={classes.chatInput}>
          <Grid item xs={8}>
            <TextField
              variant="outlined"
              fullWidth
              label="Type your message"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <Button variant="contained" color="primary" onClick={handleSendMessage}>Send</Button>
          </Grid>
        </Grid>
      </Sidebar>
    </div>
  );
};

export default App;
