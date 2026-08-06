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

function adminApp() {
    return {
        mangas: [],
        isEdit: false,
        editId: null,
        form: {
            title: '',
            author: '',
            category: 'Action',
            buyUrl: '',
            cover: '',
            synopsis: ''
        },

        init() {
            auth.onAuthStateChanged(user => {
                if (!user) {
                    alert("กรุณาเข้าสู่ระบบในฐานะ Admin");
                    window.location.href = 'auth.html';
                } else {
                    this.fetchMangas();
                }
            });
        },

        fetchMangas() {
            db.collection("mangas").onSnapshot(snapshot => {
                this.mangas = snapshot.docs.map(doc => {
                    const data = doc.data();
                    
                    // ป้องกันปัญหา Array ชน String แปลงทุกอย่างเป็น String ปลอดภัย
                    let cat = data.category;
                    if (Array.isArray(cat)) cat = cat[0] || 'Action';

                    return {
                        id: doc.id,
                        title: String(data.title || ''),
                        author: String(data.author || ''),
                        category: String(cat || 'Action'),
                        buyUrl: String(data.buyUrl || ''),
                        cover: String(data.cover || ''),
                        synopsis: String(data.synopsis || '')
                    };
                });
            });
        },

        saveManga() {
            // ดึงค่าจากฟอร์มตรงๆ เพื่อข้ามบัค Alpine.js
            const data = {
                title: String(this.form.title || '').trim(),
                author: String(this.form.author || '').trim(),
                category: String(this.form.category || 'Action').trim(),
                buyUrl: String(this.form.buyUrl || '').trim(),
                cover: String(this.form.cover || '').trim(),
                synopsis: String(this.form.synopsis || '').trim()
            };

            if (!data.title || !data.cover) {
                alert("กรุณากรอกชื่อเรื่องและ URL รูปปกให้ครบถ้วน");
                return;
            }

            if (this.isEdit && this.editId) {
                db.collection("mangas").doc(this.editId).set(data, { merge: true }).then(() => {
                    alert("อัปเดตข้อมูลมังงะสำเร็จ!");
                    this.resetForm();
                }).catch(err => {
                    alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
                });
            } else {
                db.collection("mangas").add(data).then(() => {
                    alert("เพิ่มมังงะเรียบร้อย!");
                    this.resetForm();
                }).catch(err => {
                    alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
                });
            }
        },

        editManga(manga) {
            this.isEdit = true;
            this.editId = manga.id;

            this.form.title = manga.title || '';
            this.form.author = manga.author || '';
            this.form.category = manga.category || 'Action';
            this.form.buyUrl = manga.buyUrl || '';
            this.form.cover = manga.cover || '';
            this.form.synopsis = manga.synopsis || '';

            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        deleteManga(id) {
            if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบมังงะเรื่องนี้?")) {
                db.collection("mangas").doc(id).delete().then(() => {
                    alert("ลบเรียบร้อยแล้ว");
                });
            }
        },

        resetForm() {
            this.isEdit = false;
            this.editId = null;
            this.form = {
                title: '',
                author: '',
                category: 'Action',
                buyUrl: '',
                cover: '',
                synopsis: ''
            };
        }
    }
}