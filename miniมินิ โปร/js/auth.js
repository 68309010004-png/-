const firebaseConfig = {
    apiKey: "AIzaSyDrlE3BW6DL729ltElYPRlruFCoig-Ibgc",
    authDomain: "m-fkjdshujfbdou.firebaseapp.com",
    projectId: "m-fkjdshujfbdou",
    storageBucket: "m-fkjdshujfbdou.firebasestorage.app",
    messagingSenderId: "1081777451090",
    appId: "1:1081777451090:web:1ec56a4455700307512f8b"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

function authApp() {
    return {
        isSignUp: false,
        email: '',
        password: '',

        handleSubmit() {
            if (this.isSignUp) {
                // สมัครสมาชิกใหม่
                auth.createUserWithEmailAndPassword(this.email, this.password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        // บันทึกข้อมูลผู้ใช้ลง Firestore
                        return db.collection("users").doc(user.uid).set({
                            id: user.uid,
                            email: user.email,
                            role: "user",
                            favorites: []
                        });
                    })
                    .then(() => {
                        alert("สมัครสมาชิกสำเร็จ!");
                        window.location.href = "index.html";
                    })
                    .catch((error) => {
                        alert("เกิดข้อผิดพลาด: " + error.message);
                    });
            } else {
                // เข้าสู่ระบบ
                auth.signInWithEmailAndPassword(this.email, this.password)
                    .then(() => {
                        window.location.href = "index.html";
                    })
                    .catch((error) => {
                        alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง: " + error.message);
                    });
            }
        }
    }
}