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

function favoritesApp() {
    return {
        favoriteMangas: [],
        currentUser: null,
        loading: true,
        showModal: false,
        selectedManga: null,

        init() {
            auth.onAuthStateChanged(user => {
                this.currentUser = user;
                if (user) {
                    this.fetchFavorites(user.uid);
                } else {
                    this.loading = false;
                    alert("กรุณาเข้าสู่ระบบเพื่อดูคลังมังงะโปรดของคุณ");
                    window.location.href = 'auth.html';
                }
            });
        },

        fetchFavorites(uid) {
            this.loading = true;
            db.collection("users").doc(uid).collection("favorites").onSnapshot(async (snapshot) => {
                const favList = [];
                
                for (const doc of snapshot.docs) {
                    const favData = doc.data();
                    const mangaDocId = doc.id;

                    let fullMangaData = {};
                    try {
                        const mangaSnap = await db.collection("mangas").doc(mangaDocId).get();
                        if (mangaSnap.exists) {
                            fullMangaData = mangaSnap.data();
                        }
                    } catch (e) {
                        console.log("Error fetching manga details:", e);
                    }

                    favList.push({
                        docId: mangaDocId,
                        title: favData.title || fullMangaData.title || 'ไม่มีชื่อ',
                        cover: favData.cover || fullMangaData.cover || 'https://via.placeholder.com/150',
                        author: fullMangaData.author || 'ไม่ระบุ',
                        synopsis: fullMangaData.synopsis || 'ไม่มีข้อมูลเรื่องย่อ',
                        buyUrl: fullMangaData.buyUrl || ''
                    });
                }

                this.favoriteMangas = favList;
                this.loading = false;
            });
        },

        removeFavorite(mangaDocId) {
            if (!this.currentUser) return;
            
            db.collection("users").doc(this.currentUser.uid)
              .collection("favorites").doc(mangaDocId).delete()
              .then(() => {
                  console.log("Removed from favorites");
              })
              .catch(err => {
                  alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
              });
        },

        openModal(manga) {
            this.selectedManga = manga;
            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.selectedManga = null;
        }
    }
}