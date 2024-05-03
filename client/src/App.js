import React, { useState, useRef, useEffect } from 'react';
import { Typography, AppBar, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

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
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 200, // Adjusted width
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
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [audioDevices, setAudioDevices] = useState([]);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputDevices);
      } catch (error) {
        console.error('Error fetching audio devices:', error);
      }
    };

    fetchDevices();
  }, []);

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedMic } });

      const mixedStream = new MediaStream();
      screenStream.getVideoTracks().forEach(track => mixedStream.addTrack(track));
      audioStream.getAudioTracks().forEach(track => mixedStream.addTrack(track));

      // Stop and reset mediaRecorderRef.current if it's already recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        setRecording(false);
        setRecordedChunks([]);
      }

      const recorder = new MediaRecorder(mixedStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = function (event) {
        if (event.data.size > 0) {
          setRecordedChunks(prevChunks => [...prevChunks, event.data]);
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      // Handle permission errors here (e.g., display an alert)
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
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

  const handleMicChange = (event) => {
    setSelectedMic(event.target.value);
  };

  return (
    <div className={classes.wrapper}>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <Typography variant="h2" align="center">Screen Recorder</Typography>
      </AppBar>
      <VideoPlayer ref={videoRef} />
      <Sidebar>
        <Notifications />
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl className={classes.formControl}>
              <InputLabel id="mic-select-label">Select Microphone</InputLabel>
              <Select
                labelId="mic-select-label"
                id="mic-select"
                value={selectedMic}
                onChange={handleMicChange}
              >
                <MenuItem value="">Default</MenuItem>
                {audioDevices.map((device, index) => (
                  <MenuItem key={index} value={device.deviceId}>{device.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            {recording ? (
              <Button variant="contained" color="secondary" onClick={stopRecording}>Stop Recording</Button>
            ) : (
              <Button variant="contained" color="primary" onClick={startRecording}>Start Recording</Button>
            )}
            {recordedChunks.length > 0 && (
              <Button variant="contained" color="primary" onClick={downloadRecording}>Download Recording</Button>
            )}
          </Grid>
        </Grid>
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
