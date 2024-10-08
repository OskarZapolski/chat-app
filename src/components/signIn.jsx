import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider, db, storage } from "../config/firebase-config";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LogIn } from "./logIn";

export function SignIn({ cookie, setIsUserFromGoogle }) {
  const nav = useNavigate();

  const q = query(collection(db, "users"));

  const emailRef = useRef("");
  const passRef = useRef("");
  const nameRef = useRef("");
  const [picture, setPicture] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const style = {
    backgroundImage: "url('logIn.jpg')",
  };

  useEffect(() => {
    async function load() {
      try {
        await addDoc(collection(db, "users"), {
          name: nameRef.current.value,
          photo: profilePhoto,
          email: emailRef.current.value,
        });

        localStorage.setItem("name", nameRef.current.value);
        localStorage.setItem("photo", profilePhoto);

        nav(`/chat-app/messenger`);
      } catch (err) {
        console.error(err);
      }
    }
    if (profilePhoto) {
      load();
    }
  }, [profilePhoto]);

  async function createAccount() {
    try {
      if (
        emailRef.current.value &&
        passRef.current.value &&
        nameRef.current.value &&
        picture.name &&
        picture.name.includes(".jpg")
      ) {
        const imagesRef = ref(
          storage,
          `images/${picture.name}${emailRef.current.value}`
        );

        await createUserWithEmailAndPassword(
          auth,
          emailRef.current.value,
          passRef.current.value
        );
        await uploadBytes(imagesRef, picture);
        await getDownloadURL(imagesRef).then((res) => {
          setProfilePhoto(res);
        });
        const docs = await getDocs(q);
        docs.forEach((doc) => {
          if (doc.data().name !== nameRef.current.value) {
            HelloMessage(doc.data(), [doc.data().name, nameRef.current.value]);
          }
        });
        addDoc(collection(db, "users"), {
          name: nameRef.current.value,
          email: nameRef.current.value,
          photo: picture.name,
        });
      } else {
        alert("error in the information provided");
      }
    } catch (err) {
      console.error(err);
    }
  }
  const messageRef = collection(db, "messages");

  async function HelloMessage(user, sorted) {
    await addDoc(messageRef, {
      text: "hello new user",
      createdAt: serverTimestamp(),
      user: user.name,
      room: `${sorted[0]}${sorted[1]}`,
      photo: user.photo,
      uploadImage: null,
      wasSeen: false,
    });
  }
  //zrob hello message dla create acc
  async function signInWithGoogle() {
    try {
      let count = 0;

      const ref = await signInWithPopup(auth, googleProvider);
      cookie.set("auth-token", ref.user.refreshToken);
      localStorage.setItem("name", auth.currentUser.displayName);
      localStorage.setItem("photo", auth.currentUser.photoURL);

      const docs = await getDocs(q);
      docs.forEach((doc) => {
        if (doc.data().name === auth.currentUser.displayName) {
          count += 1;
        }
      });
      if (count === 0) {
        docs.forEach((doc) => {
          HelloMessage(
            doc.data(),
            [doc.data().name, auth.currentUser.displayName].sort()
          );
        });
        addDoc(collection(db, "users"), {
          name: auth.currentUser.displayName,
          email: auth.currentUser.email,
          photo: auth.currentUser.photoURL,
        });
      }
      setIsUserFromGoogle(true);
      nav(`/chat-app/messenger`);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("name")) {
      nav(`/chat-app/messenger`);
    }
  }, []);

  return (
    <div className="container ">
      <div className="logoImg" style={style}></div>
      <div className="signIn-body-wrapper">
        <div className="signIn-body">
          <h1 className="h1">Chat app</h1>
          <div className="signIn-popup">
            <div className="input-with-placeholder">
              <input
                required
                type="text"
                id="email"
                ref={emailRef}
                className="create-acc-input"
              />
              <label htmlFor="email">Email</label>
            </div>
            <div className="input-with-placeholder">
              <input
                required
                type="password"
                id="pass"
                ref={passRef}
                className="create-acc-input"
              />
              <label htmlFor="pass">Password</label>
            </div>
            {!isNewUser ? (
              <>
                <div className="input-with-placeholder">
                  <input
                    type="text"
                    id="name"
                    ref={nameRef}
                    className="create-acc-input"
                  />
                  <label htmlFor="name">User name</label>
                </div>
                <label htmlFor="">Select your picture</label>
                <input
                  type="file"
                  className="input-file"
                  onChange={(e) => setPicture(e.target.files[0])}
                />
                <button className="btn-create-acc " onClick={createAccount}>
                  Create account
                </button>
              </>
            ) : (
              <LogIn emailRef={emailRef} passRef={passRef} q={q} />
            )}
          </div>
          <div className="div-wrapper">
            <button className="signIn btn" onClick={signInWithGoogle}>
              <img src="google.png" alt="" className="google-icon" />
            </button>
            <button
              className="logIn-btn btn"
              onClick={() => setIsNewUser((prev) => !prev)}
            >
              {isNewUser ? "create account" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
