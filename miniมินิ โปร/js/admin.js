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
        newManga: { title: '', author: '', cover: '', synopsis: '', genres: [] },
        editingMangaId: null,

        init() {
            auth.onAuthStateChanged(user => {
                if (user) {
                    db.collection("users").doc(user.uid).get().then(doc => {
                        if (!doc.exists || doc.data().role !== 'admin') {
                            alert("⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
                            window.location.href = 'index.html';
                        } else {
                            this.fetchMangas(); 
                        }
                    });
                } else {
                    window.location.href = 'auth.html'; 
                }
            });
        },

        logout() {
            auth.signOut().then(() => {
                window.location.href = 'index.html'; 
            });
        },

        fetchMangas() {
            db.collection("mangas").onSnapshot(snapshot => {
                this.mangas = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.mangas.push({
                        docId: doc.id,
                        title: data.title || 'ไม่มีชื่อ',
                        author: data.author || 'ไม่ระบุ',
                        cover: data.cover || data.image || 'https://via.placeholder.com/150',
                        synopsis: data.synopsis || '',
                        genres: data.genres || []
                    });
                });
            });
        },

        saveManga() {
            if (!this.newManga.title || !this.newManga.cover) {
                return alert("กรุณากรอกชื่อเรื่องและรูปลิงก์หน้าปกให้ครบจ้า!");
            }

            const mangaData = {
                title: this.newManga.title,
                author: this.newManga.author || 'ไม่ระบุ',
                cover: this.newManga.cover,
                synopsis: this.newManga.synopsis || 'ไม่มีเรื่องย่อ',
                genres: this.newManga.genres || []
            };
            
            if (this.editingMangaId) {
                db.collection("mangas").doc(this.editingMangaId).update(mangaData)
                    .then(() => {
                        alert("✅ อัปเดตข้อมูลมังงะสำเร็จแล้ว!");
                        this.cancelEdit();
                    }).catch(err => alert("เกิดข้อผิดพลาดในการอัปเดต: " + err));
            } else {
                mangaData.id = Date.now();
                db.collection("mangas").add(mangaData)
                    .then(() => {
                        alert("✅ เพิ่มมังงะเรื่องใหม่สำเร็จแล้วแกร๊!");
                        this.cancelEdit();
                    }).catch(err => alert("เกิดข้อผิดพลาดในการเพิ่ม: " + err));
            }
        },

        editManga(manga) {
            this.editingMangaId = manga.docId;
            this.newManga = {
                title: manga.title,
                author: manga.author,
                cover: manga.cover,
                synopsis: manga.synopsis,
                genres: manga.genres ? [...manga.genres] : []
            };
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        cancelEdit() {
            this.editingMangaId = null;
            this.newManga = { title: '', author: '', cover: '', synopsis: '', genres: [] };
        },

        deleteManga(docId, title) {
            if (confirm(`คุณแน่ใจนะว่าจะลบเรื่อง "${title}" ทิ้งจริงๆ?`)) {
                db.collection("mangas").doc(docId).delete()
                    .then(() => alert("🗑 ลบสำเร็จเรียบร้อย!"))
                    .catch(err => alert("ลบไม่สำเร็จ: " + err));
            }
        }
    }
}