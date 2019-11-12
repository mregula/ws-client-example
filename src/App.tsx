import React, {useEffect, useState, useRef} from 'react';
import {w3cwebsocket as W3CWebSocket} from "websocket";
import Identicon from 'react-identicons';
import {
  Navbar,
  NavbarBrand,
  UncontrolledTooltip
} from 'reactstrap';
import Editor from 'react-medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import './App.css'

const wsClient = new W3CWebSocket('ws://127.0.0.1:8000');
const contentDefaultMessage = "Start writing your document here";

const App: React.FC = () => {
  const loginInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [username, setUsername] = useState();

  const logInUser = () => {
    if (loginInputRef.current && loginInputRef.current.value) {
      const username = loginInputRef.current.value;
      if (username.trim()) {
        setUsername(username);
        wsClient.send(JSON.stringify({
              username,
              type: "userevent"
        }));
      }
    }
  }

  /* When content changes, we send the
  current content of the editor to the server. */
  const onEditorStateChange = (text: string) => {
    wsClient.send(JSON.stringify({
      type: "contentchange",
      username,
      content: text
    }));
  };

  const showLoginSection = () => (
      <div className="account">
        <div className="account__wrapper">
          <div className="account__card">
            <div className="account__profile">
              <Identicon className="account__avatar" size={64} string="randomness" />
              <p className="account__name">Hello, user!</p>
              <p className="account__sub">Join to edit the document</p>
            </div>
            <input name="username" ref={loginInputRef} className="form-control" />
            <button type="button" onClick={logInUser} className="btn btn-primary account__btn">Join</button>
          </div>
        </div>
      </div>
  );

  const   showEditorSection = () => (
      <div className="main-content">
        <div className="document-holder">
          <div className="currentusers">
            {users.map((user: any, index: number) => (
                <React.Fragment key={index}>
              <span id={user.username} className="userInfo" key={user.username}>
                <Identicon className="account__avatar" style={{ backgroundColor: user.randomcolor }} size={40} string={user.username} />
              </span>
                  <UncontrolledTooltip placement="top" target={user.username}>
                    {user.username}
                  </UncontrolledTooltip>
                </React.Fragment>
            ))}
          </div>
          <Editor
              options={{
                placeholder: {
                  text: message ? contentDefaultMessage : ""
                }
              }}
              className="body-editor"
              text={message}
              onChange={onEditorStateChange}
          />
        </div>
        <div className="history-holder">
          <ul>
            {userActivity.map((activity, index) => <li key={`activity-${index}`}>{activity}</li>)}
          </ul>
        </div>
      </div>
  )


  useEffect(() => {
    wsClient.onopen = () => {
      console.log('WebSocket Client Connected');
    };


    wsClient.onmessage = (message) => {
      if (typeof message.data === "string") {
        const dataFromServer = JSON.parse(message.data);

        if (dataFromServer.type === "userevent") {
          setUsers(Object.values(dataFromServer.data.users));
        } else if (dataFromServer.type === "contentchange") {
          setMessage(dataFromServer.data.editorContent);
        }
        setUserActivity(dataFromServer.data.userActivity);
      }
    };

  }, [])

  return (
      <React.Fragment>
        <Navbar color="light" light>
          <NavbarBrand href="/">Real-time document editor</NavbarBrand>
        </Navbar>
        <div className="container-fluid">
          {username ? showEditorSection() : showLoginSection()}
        </div>
      </React.Fragment>
  );
}

export default App;
