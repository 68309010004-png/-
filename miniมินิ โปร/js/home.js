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

function homeApp() {
    return {
        mangas: [],
        availableGenres: [],
        selectedGenre: 'All',
        searchQuery: '',
        favorites: [],
        currentUser: null,
        isAdmin: false,
        showModal: false,
        selectedManga: null,

        init() {
            auth.onAuthStateChanged(user => {
                this.currentUser = user;
                if (user) {
                    this.checkAdminStatus(user.uid);
                    this.fetchFavorites(user.uid);
                }
            });

            this.fetchMangas();
        },

        checkAdminStatus(uid) {
            db.collection("users").doc(uid).get().then(doc => {
                if (doc.exists && doc.data().role === 'admin') {
                    this.isAdmin = true;
                }
            });
        },

        fetchMangas() {
            db.collection("mangas").onSnapshot(snapshot => {
                this.mangas = [];
                const genreSet = new Set();

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const mangaItem = {
                        docId: doc.id,
                        title: data.title || 'ไม่มีชื่อ',
                        author: data.author || 'ไม่ระบุ',
                        cover: data.cover || 'https://via.placeholder.com/150',
                        synopsis: data.synopsis || 'ไม่มีข้อมูลเรื่องย่อ',
                        genres: Array.isArray(data.genres) ? data.genres : (data.genre ? [data.genre] : [])
                    };

                    this.mangas.push(mangaItem);

                    mangaItem.genres.forEach(g => {
                        if (g && typeof g === 'string' && g.trim() !== '') {
                            genreSet.add(g.trim());
                        }
                    });
                });

                this.availableGenres = Array.from(genreSet);
            });
        },

        fetchFavorites(uid) {
            db.collection("users").doc(uid).collection("favorites").onSnapshot(snapshot => {
                this.favorites = [];
                snapshot.forEach(doc => {
                    this.favorites.push(doc.id);
                });
            });
        },

        isFavorite(mangaDocId) {
            return this.favorites.includes(mangaDocId);
        },

        toggleFavorite(manga) {
            if (!this.currentUser) {
                alert("กรุณาเข้าสู่ระบบก่อนกดถูกใจการ์ตูนน้า!");
                window.location.href = 'auth.html';
                return;
            }

            const favRef = db.collection("users").doc(this.currentUser.uid).collection("favorites").doc(manga.docId);

            if (this.isFavorite(manga.docId)) {
                favRef.delete();
            } else {
                favRef.set({
                    addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    title: manga.title,
                    cover: manga.cover
                });
            }
        },

        openModal(manga) {
            this.selectedManga = manga;
            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.selectedManga = null;
        },

        logout() {
            auth.signOut().then(() => {
                window.location.href = 'auth.html';
            });
        },

        get filteredMangas() {
            return this.mangas.filter(manga => {
                const matchesGenre = this.selectedGenre === 'All' || 
                    (manga.genres && manga.genres.includes(this.selectedGenre));

                const query = this.searchQuery.toLowerCase().trim();
                const matchesSearch = !query || 
                    manga.title.toLowerCase().includes(query) || 
                    manga.author.toLowerCase().includes(query);

                return matchesGenre && matchesSearch;
            });
        }
    }
}