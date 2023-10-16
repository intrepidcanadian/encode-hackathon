import 'regenerator-runtime/runtime';
import React, {useEffect} from 'react';

import './assets/global.css';
import logo from './assets/TreeRegistry.png'

import { EducationalText, SignInPrompt, SignOutButton } from './ui-components';


export default function App({ isSignedIn, contractId, wallet }) {
  const [valueFromBlockchain, setValueFromBlockchain] = React.useState();

  const [uiPleaseWait, setUiPleaseWait] = React.useState(true);

  const [profiles, setProfiles] = React.useState([]);
  const [selectedProfile, setSelectedProfile] = React.useState(null);
  const [memorialMessages, setMemorialMessages] = React.useState([]);

  /// If user not signed-in with wallet - show prompt
  if (!isSignedIn) {
    // Sign-in flow will reload the page later
    return <SignInPrompt greeting={valueFromBlockchain} onClick={() => wallet.signIn()}/>;
  }


  useEffect(() => {
    if (isSignedIn) {
      
      fetchAllProfiles();
      setUiPleaseWait(false);
    }
  }, [isSignedIn]);

  async function fetchAllProfiles() {
    const profileIds = await wallet.viewMethod({
      method: "getAllProfileIds",
      contractId,
    });
    const fetchedProfiles = await Promise.all(
      profileIds.map((id) => getProfile(id))
    );
    setProfiles(fetchedProfiles);
  }

  async function getProfile(id) {
    return wallet.viewMethod({
      method: "getProfile",
      args: { id },
      contractId,
    });
  }

  async function registerDeceased(e) {
    e.preventDefault();
    const { fullNameInput, birthDateInput, deathDateInput, ipfsLinkInput } = e.target.elements;

    const profileData = {
        id: fullNameInput.value,
        fullName: fullNameInput.value,
        birthDate: birthDateInput.value,
        deathDate: deathDateInput.value,
        ipfsLink: ipfsLinkInput.value
    };

    await wallet.callMethod({ 
        method: 'registerDeceased', 
        args: profileData, 
        contractId 
    })
    .then(() => fetchAllProfiles())
    .catch(alert)
    .finally(() => {
        setUiPleaseWait(false);
    });
  }

  function handleProfileSelection(id) {
    const profile = profiles.find((p) => p.fullName === id);
    setSelectedProfile(profile);
    fetchMessagesForProfile(id);
  }

  async function fetchMessagesForProfile(id) {
    const messages = await wallet.viewMethod({
      method: "getMemorialMessages",
      args: { id },
      contractId,
    });
    setMemorialMessages(messages || []);
  }

  async function addMessage(e) {
    e.preventDefault();
    const { messageInput } = e.target.elements;

    await wallet.callMethod({
      method: "addMemorialMessage",
      args: { id: selectedProfile.fullName, messageText: messageInput.value },
      contractId,
    });

    console.log("Fetching messages for ID:", selectedProfile.fullName);
    const messages = await wallet.viewMethod({
      method: "getMemorialMessages",
      args: { id: selectedProfile.fullName },
      contractId,
    });
    setMemorialMessages(messages);
  }

  if (!isSignedIn) {
    return <SignInPrompt onClick={() => wallet.signIn()} />;
  }

  function formatTimestamp(nanoTimestamp) {
    const milliseconds = parseInt(nanoTimestamp) / 1000000;
    const date = new Date(milliseconds);
    return date.toLocaleString();  // You can format this further if needed
  }

  return (
    <>
      <SignOutButton
        accountId={wallet.accountId}
        onClick={() => wallet.signOut()}
      />
      <main className={uiPleaseWait ? "please-wait" : ""}>
        <h1>Ancestor Registry</h1>
        <div className = "container__logo">
           <img className = "logo" src={logo} alt="Tree Registry" />
        </div>
        <select onChange={(e) => handleProfileSelection(e.target.value)}>
          {profiles.map((profile) => (
            <option key={profile.fullName} value={profile.fullName}>
              {profile.fullName}
            </option>
          ))}
        </select>

        <h2>Register New Profile</h2>
        <form onSubmit={registerDeceased}>
            <label>Full Name:</label>
            <input id="fullNameInput" />
            <label>Birth Date:</label>
            <input id="birthDateInput" />
            <label>Death Date:</label>
            <input id="deathDateInput" />
            <label>IPFS CID for Image:</label>
            <input id="ipfsLinkInput" />
            <button type="submit">Register</button>
        </form>

        {selectedProfile && (
          <section>
            <h2>{selectedProfile.fullName}</h2>
            <div className = "container__memorial">
            <img className = "container__memorial--image"
              src={`https://ipfs.io/ipfs/${selectedProfile.ipfsLink}`}
              alt="Profile"
            />
            </div>
            <h2>Birth: {selectedProfile.birthDate}</h2>
            <h2>Death: {selectedProfile.deathDate}</h2>

            <form onSubmit={addMessage}>
              <label>Add Memorial Message:</label>
              <input id="messageInput" />
              <button>Add Message</button>
            </form>

            <ul>
              {memorialMessages.map((message, index) => (
                <li key={index}>
                  {message.message} - {message.accountId} at {formatTimestamp(message.timestamp)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
