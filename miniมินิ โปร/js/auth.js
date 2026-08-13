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

        // ฟังก์ชันช่วยเช็ก Role แล้วเปลี่ยนหน้า
        handleUserRedirect(user) {
            const userRef = db.collection("users").doc(user.uid);

            userRef.get().then(doc => {
                if (!doc.exists) {
                    // ถ้ายังไม่มีข้อมูลใน Firestore (ล็อกอิน Google ครั้งแรก) ให้สร้างใหม่
                    return userRef.set({
                        email: user.email,
                        role: 'user',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        window.location.href = 'index.html';
                    });
                } else {
                    const data = doc.data() || {};
                    // อัปเดต email ชัวร์ๆ
                    if (!data.email) {
                        userRef.set({ email: user.email }, { merge: true });
                    }

                    // เด้งตามสิทธิ์
                    const role = data.role || 'user';
                    if (role === 'superadmin') {
                        window.location.href = 'superadmin.html';
                    } else if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }
            }).catch(err => {
                console.error("Redirect Error:", err);
                window.location.href = 'index.html';
            });
        },

        // ล็อกอินด้วย Google
        loginWithGoogle() {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    this.handleUserRedirect(result.user);
                })
                .catch((error) => {
                    alert("เข้าสู่ระบบด้วย Google ไม่สำเร็จ: " + error.message);
                });
        },

        // ล็อกอิน/สมัคร ด้วย Email เดิม
        handleSubmit() {
            if (!this.isSignUp) {
                auth.signInWithEmailAndPassword(this.email, this.password)
                    .then((userCredential) => {
                        this.handleUserRedirect(userCredential.user);
                    })
                    .catch(error => alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message));
            } else {
                auth.createUserWithEmailAndPassword(this.email, this.password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        return db.collection("users").doc(user.uid).set({
                            email: user.email,
                            role: 'user',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .then(() => {
                        alert("สมัครสมาชิกสำเร็จ!");
                        window.location.href = 'index.html';
                    })
                    .catch(error => alert("สมัครสมาชิกไม่สำเร็จ: " + error.message));
            }
        }
    }
}