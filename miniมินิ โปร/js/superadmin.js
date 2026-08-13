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

function superAdminApp() {
    return {
        allUsers: [],
        currentUserId: '',
        searchQuery: '',

        init() {
            auth.onAuthStateChanged(user => {
                if (!user) {
                    alert("กรุณาเข้าสู่ระบบก่อนใช้งาน");
                    window.location.href = 'auth.html';
                } else {
                    this.currentUserId = user.uid;
                    this.verifySuperAdmin(user);
                }
            });
        },

        verifySuperAdmin(user) {
            db.collection("users").doc(user.uid).get().then(doc => {
                if (!doc.exists) {
                    alert("ไม่พบข้อมูลผู้ใช้ในระบบ");
                    window.location.href = 'index.html';
                    return;
                }

                const data = doc.data() || {};
                if (data.role === 'superadmin') {
                    this.fetchAllUsers();
                } else {
                    alert(`สิทธิ์ของคุณคือ '${data.role || 'user'}' ไม่มีสิทธิ์เข้าถึงหน้านี้`);
                    window.location.href = 'index.html';
                }
            }).catch(err => {
                console.error("Auth error:", err);
                window.location.href = 'index.html';
            });
        },

        fetchAllUsers() {
            // ดึงผู้ใช้งานทั้งหมดใน Firestore แบบ Realtime
            db.collection("users").onSnapshot(snapshot => {
                this.allUsers = snapshot.docs.map(doc => ({
                    id: doc.id,
                    email: doc.data().email || 'ไม่ระบุ Email',
                    role: doc.data().role || 'user'
                }));
            }, err => console.error("Fetch Users Error:", err));
        },

        get filteredUsers() {
            const query = this.searchQuery.trim().toLowerCase();
            if (!query) return this.allUsers;
            return this.allUsers.filter(user => user.email.toLowerCase().includes(query));
        },

        changeUserRole(userId, email, newRole) {
            if (confirm(`คุณต้องการเปลี่ยนสิทธิ์ของ ${email} เป็น '${newRole.toUpperCase()}' ใช่หรือไม่?`)) {
                db.collection("users").doc(userId).update({
                    role: newRole
                }).then(() => {
                    alert(`อัปเดตสิทธิ์ของ ${email} เป็น ${newRole.toUpperCase()} เรียบร้อยแล้ว!`);
                }).catch(err => {
                    alert("เกิดข้อผิดพลาด: " + err.message);
                });
            } else {
                // ถ้าวิทยากด Cancel ให้รีเฟรช Snap เพื่อคืนค่า UI เดิม
                this.fetchAllUsers();
            }
        }
    }
}